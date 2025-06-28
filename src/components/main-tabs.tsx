"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserProfile } from "@/lib/types";
import ProblemList from "@/components/problem-list";
import SolutionList from "@/components/solution-list";
import AiMatchmaking from "@/components/ai-matchmaking";
import RandomIdeas from "./random-ideas";
import BusinessList from "./business-list";

interface MainTabsProps {
    userProfile: UserProfile | null;
}

export default function MainTabs({ userProfile }: MainTabsProps) {
  const [activeTab, setActiveTab] = useState("problems");

  return (
    <Tabs defaultValue="problems" className="w-full" onValueChange={setActiveTab} value={activeTab}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-5">
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="businesses">Running Businesses</TabsTrigger>
          <TabsTrigger value="random-ideas">Random Ideas</TabsTrigger>
          <TabsTrigger value="ai-matchmaking">AI Matchmaking</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="problems" className="mt-6">
        {activeTab === 'problems' && <ProblemList />}
      </TabsContent>
      <TabsContent value="solutions" className="mt-6">
        {activeTab === 'solutions' && <SolutionList />}
      </TabsContent>
      <TabsContent value="businesses" className="mt-6">
        {activeTab === 'businesses' && <BusinessList />}
      </TabsContent>
       <TabsContent value="random-ideas" className="mt-6">
        {activeTab === 'random-ideas' && <RandomIdeas />}
      </TabsContent>
      <TabsContent value="ai-matchmaking" className="mt-6">
        {activeTab === 'ai-matchmaking' && <AiMatchmaking />}
      </TabsContent>
    </Tabs>
  );
}
