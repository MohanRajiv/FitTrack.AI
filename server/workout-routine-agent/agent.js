import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { search_exercises } from "./tool.js";
import { getWorkoutSystemMessage } from "./prompts.js";

const WorkoutState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  user_prefs: Annotation(), 
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  apiKey: `${process.env.GEMINI_API_KEY}`,
}).bindTools([search_exercises]);

const llmCall = async (state) => {
  const { targetSets, repRange, injuries, equipment } = state.user_prefs; 

  const systemMessage = getWorkoutSystemMessage(targetSets, repRange, injuries);

  const response = await model.invoke([
    systemMessage,
    ...state.messages,
    { role: "user", content: `My available equipment: ${equipment.join(", ")}` }  
  ]);
  return { messages: [response] };
};

const toolNode = async (state) => {
    const lastMessage = state.messages.at(-1);
    const result = [];

    if (lastMessage.tool_calls) {
        console.log("--- Agent is searching for: ---");
        lastMessage.tool_calls.forEach(tc => {
          console.log(`Tool: ${tc.name} | Muscle: ${tc.args.muscle_group}`);
        });
    }
    
    for (const toolCall of lastMessage.tool_calls ?? []) {
      if (toolCall.name === "search_exercises") {
        const observation = await search_exercises.invoke(toolCall);
        result.push(observation);
      }
    }
    return { messages: result };
  };

  const volumeAndSequenceNode = async (state) => {
    const toolMessages = state.messages.filter(m => m instanceof ToolMessage);
    let allFound = [];
    toolMessages.forEach(msg => {
        try {
            allFound = allFound.concat(JSON.parse(msg.content));
        } catch (e) { console.error("Parse error", e); }
    });

    // 1. Find the last AI message that actually has text content
    const lastAiMsg = state.messages.findLast(m => 
        m instanceof AIMessage && typeof m.content === 'string' && m.content.length > 0
    );

    // 2. Safeguard: If for some reason no text message exists yet, 
    // we use a default string so the code doesn't crash.
    const aiText = lastAiMsg?.content || "Here is your optimized workout routine:";
    
    const selectionMatch = aiText.match(/\[(.*?)\]/);
    let selection = [];

    if (selectionMatch) {
        const names = selectionMatch[1].split(',').map(n => n.trim().toLowerCase());
        selection = allFound.filter(ex => names.includes(ex.name.toLowerCase()));
    } 
    
    // Fallback if the bracket search failed or returned nothing
    if (selection.length === 0) {
        // Unique by name, take 5
        selection = Array.from(new Map(allFound.map(item => [item.name, item])).values()).slice(0, 5);
    }

    const sorted = selection.sort((a, b) => a.fatigue_score - b.fatigue_score);
    const { targetSets, repRange } = state.user_prefs;
    
    // Avoid division by zero if selection is empty
    const div = sorted.length || 1; 
    const baseSets = Math.floor(targetSets / div);
    let extraSets = targetSets % div;

    const finalizedWorkout = sorted.map((ex, i) => ({
        ...ex,
        sets: i < extraSets ? baseSets + 1 : baseSets,
        reps: repRange,
        rest: ex.fatigue_score === 1 ? "3-5 mins" : "60-90s"
    }));

    return {
        messages: [new AIMessage({
            content: aiText, // Use our safe string variable
            additional_kwargs: { workout_json: finalizedWorkout }
        })]
    };
};

const shouldContinue = (state) => {
  const lastMessage = state.messages.at(-1);
  if (lastMessage?.tool_calls?.length) return "toolNode";
  return "volumeNode";
};

const workflow = new StateGraph(WorkoutState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addNode("volumeNode", volumeAndSequenceNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, {
    toolNode: "toolNode",
    volumeNode: "volumeNode"
  })
  .addEdge("toolNode", "llmCall")
  .addEdge("volumeNode", END);

export const workoutAgent = workflow.compile();