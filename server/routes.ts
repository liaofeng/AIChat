import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatSchema } from "@shared/schema";
import { ZodError } from "zod";
import { getChatCompletion } from "./openai";

export function registerRoutes(app: Express): Server {
  app.post("/api/chat", async (req, res) => {
    const sessionId = req.session?.id || "default";

    try {
      const { message } = chatSchema.parse(req.body);

      // Save user message
      const userMessage = await storage.createMessage({
        sessionId,
        role: "user",
        content: message
      });

      // Get chat history
      const history = await storage.getMessages(sessionId);

      // Get AI response
      const aiResponse = await getChatCompletion(history);

      // Save AI response
      const assistantMessage = await storage.createMessage({
        sessionId,
        role: "assistant",
        content: aiResponse
      });

      res.json({ messages: [userMessage, assistantMessage] });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid request format" });
      } else {
        console.error("Chat error:", error);
        res.status(500).json({ message: "Failed to process chat message" });
      }
    }
  });

  app.get("/api/messages", async (req, res) => {
    const sessionId = req.session?.id || "default";
    try {
      const messages = await storage.getMessages(sessionId);
      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}