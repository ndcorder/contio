import type { ChatMessage, ModelParticipant, DiscussionMode } from '$lib/models';

export function buildMessages(
  systemPrompt: string,
  userPrompt: string,
  transcript: ChatMessage[],
  currentParticipant: ModelParticipant,
  isFinalRound: boolean,
  mode?: DiscussionMode,
  participantIndex?: number,
  totalParticipants?: number
): ChatMessage[] {
  // Determine system prompt: use mode-specific if available
  let effectiveSystemPrompt = mode?.systemPrompt ?? systemPrompt;

  // Handle role assignment for modes like Devil's Advocate
  if (mode?.participantRoles && participantIndex !== undefined && totalParticipants !== undefined) {
    const { strategy, roles } = mode.participantRoles;
    if (strategy === 'assign-one' && participantIndex === 0 && roles.length > 0) {
      effectiveSystemPrompt += '\n\n' + roles[0];
    } else if (strategy === 'assign-all') {
      const roleIndex = participantIndex % roles.length;
      effectiveSystemPrompt += '\n\n' + roles[roleIndex];
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: effectiveSystemPrompt },
    { role: 'user', content: userPrompt }
  ];

  for (const entry of transcript) {
    if (entry.participantName === currentParticipant.displayName) {
      messages.push({
        role: 'assistant',
        content: entry.content,
        participantName: entry.participantName
      });
    } else {
      messages.push({
        role: 'user',
        content: `[${entry.participantName}]: ${entry.content}`,
        participantName: entry.participantName
      });
    }
  }

  if (isFinalRound) {
    const finalPrompt = mode?.finalRoundPrompt ?? 'Please summarize your position concisely.';
    messages.push({
      role: 'user',
      content: finalPrompt
    });
  }

  return messages;
}

export function buildObserverPrompt(
  originalPrompt: string,
  currentRound: number,
  totalRounds: number,
  lastRoundMessages: ChatMessage[]
): string {
  const lastRoundText = lastRoundMessages
    .map(m => `**${m.participantName}:** ${m.content}`)
    .join('\n\n');

  return `You are observing a multi-model AI discussion to determine if it has naturally concluded.

**Original Topic:** ${originalPrompt}

**Current Round:** ${currentRound} of ${totalRounds} maximum

**Latest Round of Responses:**
${lastRoundText}

---

Analyze whether the discussion has reached a natural conclusion. Signs of conclusion include:
- Participants are mostly agreeing and summarizing rather than adding new points
- Key arguments have been thoroughly explored from multiple angles
- Responses are becoming repetitive or circular
- Participants are using concluding language ("in summary", "overall", "to conclude")
- No significant new perspectives or counterarguments are being introduced

Signs the discussion should CONTINUE:
- New substantive points are still being raised
- There are unresolved disagreements being actively debated
- Important aspects of the topic haven't been addressed yet
- Participants are building on each other's ideas productively

Respond with ONLY one word: CONCLUDE or CONTINUE`;
}

export function buildSummaryPrompt(
  originalPrompt: string,
  transcript: ChatMessage[]
): string {
  const transcriptText = transcript
    .map(m => `**${m.participantName}:**\n${m.content}`)
    .join('\n\n');

  return `You are summarizing a multi-model AI discussion. Provide a clear, structured summary.

**Original Prompt:** ${originalPrompt}

**Discussion Transcript:**
${transcriptText}

---

Please provide a summary with the following sections:
1. **Key Points:** The main arguments and insights raised
2. **Areas of Agreement:** Points where participants reached consensus
3. **Areas of Disagreement:** Points of contention or differing views
4. **Conclusion:** The overall outcome or synthesis of the discussion

Be concise but comprehensive. Focus on substance over process.`;
}

const VERDICT_TEMPLATES: Record<string, string> = {
  'debate': `You are rendering a verdict on a multi-model AI debate.

**Original Topic:** {{prompt}}

**Discussion Transcript:**
{{transcript}}

---

Provide a structured verdict with these sections:
1. **Key Arguments:** The strongest arguments raised by each side
2. **Areas of Agreement:** Points where participants reached consensus
3. **Areas of Disagreement:** Points of contention that remained unresolved
4. **Verdict:** Your recommended conclusion based on the strength of arguments presented

Be decisive. If one side made stronger arguments, say so clearly.`,

  'devils-advocate': `You are analyzing a devil's advocate discussion.

**Original Topic:** {{prompt}}

**Discussion Transcript:**
{{transcript}}

---

Provide a structured analysis with these sections:
1. **Original Position:** The main position that was presented
2. **Strongest Challenges:** The most compelling counterarguments raised by the devil's advocate
3. **Survived Scrutiny?** Did the original position hold up under adversarial pressure? What was weakened?
4. **Final Assessment:** An improved, pressure-tested version of the position that addresses the strongest challenges

Be honest about whether the position survived or was significantly weakened.`,

  'steelman': `You are summarizing a steelman discussion.

**Original Topic:** {{prompt}}

**Discussion Transcript:**
{{transcript}}

---

Provide a structured summary with these sections:
1. **Positions Explored:** The main positions and their steelmanned versions
2. **Strongest Steelman:** Which steelmanned argument proved most robust and why
3. **Key Insights:** What was revealed by the steelmanning process that wouldn't have surfaced in normal debate
4. **Synthesis:** The most defensible conclusion incorporating the strongest elements from all positions`,

  'socratic': `You are summarizing a Socratic inquiry.

**Original Topic:** {{prompt}}

**Discussion Transcript:**
{{transcript}}

---

Provide a structured summary with these sections:
1. **Key Questions Explored:** The most important questions that were raised
2. **Insights Uncovered:** What the questioning process revealed
3. **Assumptions Challenged:** Which assumptions were exposed and examined
4. **Open Questions:** The most important questions that remain unanswered and deserve further exploration`,

  'pros-cons': `You are synthesizing a pros and cons analysis.

**Original Topic:** {{prompt}}

**Discussion Transcript:**
{{transcript}}

---

Provide a structured verdict with these sections:
1. **Consolidated Pros:** All arguments in favor, deduplicated and ranked by strength
2. **Consolidated Cons:** All arguments against, deduplicated and ranked by strength
3. **Weighted Verdict:** Which side is stronger overall? Be specific about which factors tip the balance
4. **Key Considerations:** Any important caveats, conditions, or "it depends" factors`,

  'brainstorm': `You are summarizing a brainstorming session.

**Original Topic:** {{prompt}}

**Discussion Transcript:**
{{transcript}}

---

Provide a structured summary with these sections:
1. **All Ideas Generated:** A comprehensive list of every distinct idea raised
2. **Top 3 Most Promising:** The three ideas with the most potential, with rationale for each
3. **Interesting Combinations:** Ideas that could be combined for even stronger results
4. **Suggested Next Steps:** Concrete actions to develop the most promising ideas further`
};

export function buildVerdictPrompt(
  modeId: string,
  originalPrompt: string,
  transcript: ChatMessage[]
): string {
  const transcriptText = transcript
    .map(m => `**${m.participantName}:**\n${m.content}`)
    .join('\n\n');

  const template = VERDICT_TEMPLATES[modeId] ?? VERDICT_TEMPLATES['debate'];

  return template
    .replace('{{prompt}}', originalPrompt)
    .replace('{{transcript}}', transcriptText);
}
