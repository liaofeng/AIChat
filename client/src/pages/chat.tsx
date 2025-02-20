import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, HelpCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Chat() {
  const [input, setInput] = useState("");
  const [selectedScene, setSelectedScene] = useState("scene1");
  const { toast } = useToast();

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["/api/messages"],
  });

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json() as Promise<{ messages: Message[] }>;
    },
    onSuccess: (data) => {
      setInput("");
      const currentMessages = messagesData?.messages || [];
      queryClient.setQueryData(["/api/messages"], {
        messages: [...currentMessages, ...data.messages]
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "错误",
        description: "发送消息失败"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      mutation.mutate(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const messages = messagesData?.messages || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* 场景选择下拉框和帮助文档图标 */}
      <div className="mx-auto max-w-4xl mb-4 flex justify-end items-center gap-2">
        <span className="text-sm font-medium">场景：</span>
        <Select value={selectedScene} onValueChange={setSelectedScene}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择场景" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scene1">场景 1</SelectItem>
            <SelectItem value="scene2">场景 2</SelectItem>
            <SelectItem value="scene3">场景 3</SelectItem>
          </SelectContent>
        </Select>
        <a
          href="https://www.baidu.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
          title="帮助文档"
        >
          <HelpCircle className="h-5 w-5" />
        </a>
      </div>

      <Card className="mx-auto max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
        <ScrollArea className="flex-1 p-4 pb-20">
          {messagesLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="mx-auto max-w-4xl flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift + Enter 发送)"
            disabled={mutation.isPending}
            className="min-h-[60px] max-h-[200px] resize-none"
          />
          <Button type="submit" disabled={mutation.isPending} className="self-end">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
