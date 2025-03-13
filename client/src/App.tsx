import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Chat from "@/pages/chat";
import Tetris from "@/pages/tetris";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <nav className="bg-background border-b p-4">
        <div className="container mx-auto flex gap-4">
          <Link href="/">
            <a className="hover:underline">聊天</a>
          </Link>
          <Link href="/tetris">
            <a className="hover:underline">俄罗斯方块</a>
          </Link>
        </div>
      </nav>
      <Switch>
        <Route path="/" component={Chat} />
        <Route path="/tetris" component={Tetris} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
