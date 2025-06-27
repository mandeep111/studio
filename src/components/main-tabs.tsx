"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { problemData, solutionData } from "@/lib/mock-data";
import ProblemCard from "@/components/problem-card";
import SolutionCard from "@/components/solution-card";
import AiMatchmaking from "@/components/ai-matchmaking";

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState("problems");

  return (
    <Tabs defaultValue="problems" className="w-full" onValueChange={setActiveTab} value={activeTab}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="ai-matchmaking">AI Matchmaking</TabsTrigger>
        </TabsList>
        <div className="h-10 w-full sm:w-auto">
          {activeTab === 'problems' && (
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit a Problem
            </Button>
          )}
          {activeTab === 'solutions' && (
             <Button className="w-full">
              <Lightbulb className="mr-2 h-4 w-4" />
              Submit a Solution
            </Button>
          )}
        </div>
      </div>
      <TabsContent value="problems" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Open Problems</CardTitle>
            <CardDescription>Browse challenges awaiting innovative solutions.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problemData.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="solutions" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Proposed Solutions</CardTitle>
            <CardDescription>Explore creative solutions submitted by our community.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {solutionData.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="ai-matchmaking" className="mt-6">
        <AiMatchmaking />
      </TabsContent>
    </Tabs>
  );
}
