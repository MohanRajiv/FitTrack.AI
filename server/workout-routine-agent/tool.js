import { tool } from "@langchain/core/tools";
import { z } from "zod"
import fs from "fs"

const EXERCISES = JSON.parse(fs.readFileSync('./public/exercises_with_scores.json', 'utf8'));

export const search_exercises = tool(
    async ({ muscle_group, equipment_available }) => {
        const results = EXERCISES.filter(ex => {
          const matchesMuscle = (ex.primaryMuscles || []).some(m => 
            (m || "").toLowerCase().includes(muscle_group.toLowerCase())
          );

          const matchesEquip = equipment_available.some(e => 
            e.toLowerCase() === (ex.equipment || "").toLowerCase()
          );

          return matchesMuscle && matchesEquip;
        });
    
        return JSON.stringify(results.map(ex => ({
          name: ex.name,
          fatigue_score: ex.fatigue_score,
          mechanic: ex.mechanic
        })));
    },
    {
        name: "search_exercises",
        description: "Finds exercises for a specific muscle group based on what equipment is available.",
        schema: z.object({
          muscle_group: z.string(),
          equipment_available: z.array(z.string()),
        }),
     }
);