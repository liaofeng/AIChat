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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-4xl items-center">
          <nav className="flex flex-1 items-center space-x-4">
            <Select value={selectedScene} onValueChange={setSelectedScene}>
              <SelectTrigger className="w-[180px] bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 hover:from-primary/20 hover:via-accent/10 hover:to-secondary/20 transition-all duration-300">
                <SelectValue placeholder="选择场景" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scene1" className="hover:bg-primary/10">场景 1</SelectItem>
                <SelectItem value="scene2" className="hover:bg-secondary/10">场景 2</SelectItem>
                <SelectItem value="scene3" className="hover:bg-accent/10">场景 3</SelectItem>
              </SelectContent>
            </Select>
          </nav>
          <div className="flex items-center">
            <a
              href="https://www.baidu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gradient-to-r from-accent/10 to-transparent hover:from-accent/20 transition-all duration-300 hover:scale-110 h-9 w-9"
              title="帮助文档"
            >
              <HelpCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <Card className="mx-auto max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex animate-in fade-in slide-in-from-${message.role === "user" ? "right" : "left"} duration-300 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-3 max-w-[85%] shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-12"
                          : "bg-gradient-to-r from-secondary/10 to-accent/5 border border-secondary/20 mr-12"
                      } transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t bg-gradient-to-r from-background via-accent/5 to-background p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Shift + Enter 发送)"
                disabled={mutation.isPending}
                className="min-h-[60px] max-h-[200px] resize-none bg-background/80 backdrop-blur"
              />
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                size="icon"
                className="self-end h-[60px]"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}
