import { useState } from 'react';
import { Icon } from '../Icon';
import type { StoryStrings } from '../../lib/story/strings-en';
import { addRevision, createMemory, questionEvent, updateMemory } from '../../lib/story/store';
import { count } from '../../lib/telemetry';
import { toast } from '../../lib/toast';
import type { Prompt } from './Recorder';

/** For anyone who would rather type: the same memory, written instead of spoken. */
export default function WriteStory({ s, prompt, onSaved, onClose }: { s: StoryStrings; prompt: Prompt; onSaved: (id: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const save = async () => {
    const m = createMemory({ questionId: prompt.id, question: prompt.title, chapterId: prompt.chapterId ?? null, sessionId: prompt.sessionId });
    await updateMemory(m.id, { title: title.trim().slice(0, 120) });
    addRevision(m.id, { text: text.trim(), style: 'written', source: 'user' });
    if (prompt.id) void questionEvent(prompt.id, { answeredAt: Date.now(), memoryId: m.id });
    count('story.memory_saved');
    toast(s.savedLocal);
    onSaved(m.id);
  };
  return (
    <section className="recorder write" aria-labelledby="w-q">
      <p className="rec-kicker">{s.writeTitle}</p>
      <h1 id="w-q" className="rec-question">
        {prompt.title}
      </h1>
      {prompt.text && <p className="rec-hint">{prompt.text}</p>}
      <p className="muted">{s.writeHint}</p>
      <label className="field">
        <span>{s.storyTitleLabel}</span>
        <input className="text-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
      </label>
      <label className="field">
        <span>{s.storyTextLabel}</span>
        <textarea className="story-textarea" rows={14} value={text} onChange={e => setText(e.target.value)} />
      </label>
      <div className="row">
        <button className="btn primary big" onClick={() => void save()} disabled={!text.trim()}>
          <Icon name="check" size={24} /> {s.saveWriting}
        </button>
        <button className="btn quiet" onClick={onClose}>
          {s.cancel}
        </button>
      </div>
    </section>
  );
}
