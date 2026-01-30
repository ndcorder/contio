import type { ChatMessage, ModelParticipant } from '$lib/models';

export function buildMessages(
  systemPrompt: string,
  userPrompt: string,
  transcript: ChatMessage[],
  currentParticipant: ModelParticipant,
  isFinalRound: boolean
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  for (const entry of transcript) {
    if (entry.participantName === currentParticipant.displayName) {
      // This participant's own messages appear as assistant
      messages.push({
        role: 'assistant',
        content: entry.content,
        participantName: entry.participantName
      });
    } else {
      // Other participants' messages appear as user with name prefix
      messages.push({
        role: 'user',
        content: `[${entry.participantName}]: ${entry.content}`,
        participantName: entry.participantName
      });
    }
  }

  if (isFinalRound) {
    messages.push({
      role: 'user',
      content: 'Please summarize your position concisely.'
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
