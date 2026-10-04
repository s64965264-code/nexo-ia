import { getAuth } from "@clerk/express";
import OpenAI from "openai";
import { Router, type IRouter, type RequestHandler } from "express";
import {
  GetStudyStatusResponse,
  SendStudyMessageBody,
  SendStudyMessageResponse,
  SendStudyVoiceMessageBody,
  SendStudyVoiceMessageResponse,
} from "@workspace/api-zod";
import { spawn } from "node:child_process";

const router: IRouter = Router();
const textModel = "gpt-5.4-mini";
const voiceModel = "gpt-audio-1.5";

const tutorModes: Record<string, string> = {
  tutor:
    "Explica con claridad, adapta el nivel al estudiante y guía paso a paso. Haz preguntas para comprobar comprensión en vez de dar solo la respuesta final.",
  quiz:
    "Crea una práctica breve e interactiva sobre el tema. Presenta una pregunta por turno, espera la respuesta del estudiante y después explica por qué es correcta o incorrecta.",
  study_plan:
    "Ayuda a crear un plan de estudio realista y ordenado. Si faltan el plazo o el tiempo disponible, pregunta por ellos antes de inventar un calendario.",
  flashcards:
    "Crea tarjetas de estudio concisas con una pregunta al frente y una respuesta clara al reverso. Presenta unas pocas por turno y luego invita a practicar.",
  summarize:
    "Resume el material con ideas principales, conceptos clave y una conclusión breve. Distingue claramente los hechos de cualquier incertidumbre.",
};

const requireAuth: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Inicia sesión para usar el tutor." });
    return;
  }
  next();
};

function newOpenAIClient(): OpenAI | undefined {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey, maxRetries: 0 }) : undefined;
}

function tutorSystemPrompt(mode: string, subject?: string): string {
  const subjectContext = subject?.trim()
    ? `La materia seleccionada es ${subject.trim()}.`
    : "";

  return [
    "Eres Nexo, un tutor de estudio útil, cuidadoso y alentador. Responde en español salvo que el estudiante pida otro idioma.",
    "Prioriza que el estudiante aprenda: explica el razonamiento, corrige errores con respeto, no inventes citas ni datos y reconoce cuando no estás seguro.",
    subjectContext,
    tutorModes[mode] ?? tutorModes.tutor,
  ]
    .filter(Boolean)
    .join("\n");
}

function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(
    value,
  );
}

function transcodeToMp3(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "24000",
      "-b:a",
      "32k",
      "-f",
      "mp3",
      "pipe:1",
    ]);
    const output: Buffer[] = [];
    let outputBytes = 0;
    let errorOutput = "";

    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > 8 * 1024 * 1024) {
        ffmpeg.kill("SIGKILL");
        reject(new Error("Audio is too large after conversion"));
        return;
      }
      output.push(chunk);
    });
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      errorOutput = `${errorOutput}${chunk.toString("utf8")}`.slice(-1000);
    });
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || "Audio conversion failed"));
        return;
      }
      resolve(Buffer.concat(output));
    });
    ffmpeg.stdin.on("error", reject);
    ffmpeg.stdin.end(input);
  });
}

router.get("/study/status", (_req, res): void => {
  res.json(
    GetStudyStatusResponse.parse({
      available: Boolean(process.env.OPENAI_API_KEY),
      model: textModel,
    }),
  );
});

router.post(
  "/study/chat",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = SendStudyMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "La solicitud del tutor no es válida." });
      return;
    }

    const client = newOpenAIClient();
    if (!client) {
      res.status(503).json({ error: "El motor de IA no está configurado." });
      return;
    }

    if (parsed.data.messages.length === 0) {
      res.status(400).json({ error: "Escribe una pregunta para comenzar." });
      return;
    }

    for (const message of parsed.data.messages) {
      if (
        message.imageDataUrl &&
        (message.role !== "user" || !isValidImageDataUrl(message.imageDataUrl))
      ) {
        res.status(400).json({ error: "La imagen adjunta no es válida." });
        return;
      }
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: tutorSystemPrompt(parsed.data.mode, parsed.data.subject),
      },
    ];

    for (const message of parsed.data.messages) {
      if (message.imageDataUrl && message.role === "user") {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text:
                message.content ||
                "Mira la imagen y ayúdame a entender lo que aparece.",
            },
            {
              type: "image_url",
              image_url: { url: message.imageDataUrl },
            },
          ],
        });
      } else {
        messages.push({ role: message.role, content: message.content });
      }
    }

    try {
      const completion = await client.chat.completions.create({
        model: textModel,
        max_completion_tokens: 8192,
        messages,
        store: false,
      });
      const answer = completion.choices[0]?.message.content?.trim();
      if (!answer) {
        res.status(502).json({ error: "El tutor no devolvió una respuesta." });
        return;
      }

      res.json(
        SendStudyMessageResponse.parse({
          answer,
          model: textModel,
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
        }),
      );
    } catch (error) {
      const status = error instanceof OpenAI.APIError ? error.status : undefined;
      req.log.error(
        { upstreamStatus: status },
        "Nexo IA text request failed",
      );
      res
        .status(status === 429 ? 429 : 502)
        .json({ error: "No se pudo obtener una respuesta. Inténtalo de nuevo." });
    }
  },
);

router.post(
  "/study/voice",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = SendStudyVoiceMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "La solicitud de voz no es válida." });
      return;
    }

    const client = newOpenAIClient();
    if (!client) {
      res.status(503).json({ error: "El motor de IA no está configurado." });
      return;
    }

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.data.audioBase64)) {
      res.status(400).json({ error: "El audio adjunto no es válido." });
      return;
    }

    const audioBuffer = Buffer.from(parsed.data.audioBase64, "base64");
    if (audioBuffer.length === 0) {
      res.status(400).json({ error: "El audio adjunto está vacío." });
      return;
    }

    let audioForModel: Buffer;
    try {
      audioForModel =
        parsed.data.audioFormat === "wav" || parsed.data.audioFormat === "mp3"
          ? audioBuffer
          : await transcodeToMp3(audioBuffer);
    } catch {
      res.status(400).json({
        error: "No se pudo procesar ese audio. Prueba grabarlo otra vez.",
      });
      return;
    }

    const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${tutorSystemPrompt("tutor")}\nEscucha la pregunta hablada, responde de forma breve y natural, y habla en español.`,
      },
      ...parsed.data.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Escucha mi pregunta de estudio y responde en español.",
          },
          {
            type: "input_audio",
            input_audio: {
              data: audioForModel.toString("base64"),
              format: "mp3",
            },
          },
        ],
      },
    ];

    try {
      const completion = await client.chat.completions.create({
        model: voiceModel,
        modalities: ["text", "audio"],
        audio: { voice: "alloy", format: "wav" },
        messages: history,
        store: false,
      });
      const message = completion.choices[0]?.message;
      const answer =
        typeof message?.content === "string"
          ? message.content.trim()
          : message?.audio?.transcript?.trim();
      const audioBase64 = message?.audio?.data;

      if (!answer || !audioBase64) {
        res.status(502).json({ error: "El tutor de voz no pudo responder." });
        return;
      }

      res.json(
        SendStudyVoiceMessageResponse.parse({
          transcript: message.audio?.transcript?.trim() ?? "",
          answer,
          audioBase64,
          audioMimeType: "audio/wav",
          model: voiceModel,
        }),
      );
    } catch (error) {
      const status = error instanceof OpenAI.APIError ? error.status : undefined;
      req.log.error(
        { upstreamStatus: status },
        "Nexo IA voice request failed",
      );
      res
        .status(status === 429 ? 429 : 502)
        .json({ error: "No se pudo completar la conversación de voz." });
    }
  },
);

export default router;