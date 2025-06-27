import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { randomIdeasData } from "@/lib/mock-data";
import IdeaCard from "./idea-card";

export default function RandomIdeas() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Random Ideas</CardTitle>
        <CardDescription>
          A space for brilliant thoughts not tied to a specific problem.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {randomIdeasData.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </CardContent>
    </Card>
  );
}
