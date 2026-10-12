import { useState } from 'react';
import { storageSet } from '@shared/utils/storage';
import { EDITOR_REQUEST_KEY, readEditorRequest, type CompositionEditor, type EditorRequest } from './compositionRepository';

export default function CompositionImportNotice({ target, onImport }: { target: CompositionEditor; onImport: (request: EditorRequest) => void }) {
  const [request, setRequest] = useState(() => readEditorRequest(target));
  if (!request) return null;
  return <aside style={{ padding: 14, border: '1px solid #7c3aed', borderRadius: 10, color: '#e6edf3', background: '#1b1530' }}>
    <strong>{request.snapshot.title}</strong> · {request.snapshot.tonic} {request.snapshot.mode}
    <p style={{ fontSize: 12 }}>Load this composition into the editor. Your current editor draft will be replaced; the saved project stays in the archive.</p>
    <button type="button" onClick={() => { onImport(request); storageSet(EDITOR_REQUEST_KEY, null); setRequest(null); }}>Load composition</button>{' '}
    <button type="button" onClick={() => { storageSet(EDITOR_REQUEST_KEY, null); setRequest(null); }}>Dismiss</button>
  </aside>;
}
