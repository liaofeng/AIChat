import React from "react";
import { Link } from "wouter";
import { cn } from "../../lib/utils";

export function Navbar() {
  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">AIChat</span>
            </div>
            <div className="ml-6 flex space-x-8">
              <Link href="/">
                <a className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-foreground hover:border-primary hover:text-primary">
                  Chat
                </a>
              </Link>
              <Link href="/tetris">
                <a className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-foreground hover:border-primary hover:text-primary">
                  Tetris
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
