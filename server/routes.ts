import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatSchema } from "@shared/schema";
import { ZodError } from "zod";
import { mockService } from "./services/mock";
import { getChatCompletion } from "./deepseek";

export function registerRoutes(app: Express): Server {
  app.post("/api/chat", async (req, res) => {
    const sessionId = req.body.sessionId || req.session?.id || "default";

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

      try {
        let response: string;
        if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_SERVICE === 'true') {
          // Use mock service in development
          const mockMessages = await mockService.chat(message, sessionId);
          const [userMsg, assistantMsg] = mockMessages;
          response = assistantMsg.content;
        } else {
          // Use deepseek in production
          response = await getChatCompletion(history);
        }

        // Save response
        const assistantMessage = await storage.createMessage({
          sessionId,
          role: "assistant",
          content: response
        });

        res.json({ messages: [userMessage, assistantMessage] });
      } catch (error) {
        console.error("Chat service error:", error);

        // Save error message as AI response
        const errorMessage = await storage.createMessage({
          sessionId,
          role: "assistant",
          content: "抱歉，AI服务暂时不可用，请检查API密钥是否正确设置。"
        });

        res.json({ messages: [userMessage, errorMessage] });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "消息格式无效" });
      } else {
        console.error("Chat error:", error);
        res.status(500).json({ message: "处理聊天消息时出错" });
      }
    }
  });

  app.get("/api/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string || req.session?.id || "default";
    try {
      const messages = await storage.getMessages(sessionId);
      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "获取消息失败" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
