"""Persistent local transcription worker. One JSON request and response per line."""
import json
import os
import sys
import tempfile
import base64

MODELS = {'tiny', 'base', 'small', 'medium', 'large-v3', 'distil-large-v3'}

def respond(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)

def main():
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        respond({'type': 'fatal', 'error': 'faster-whisper is not installed. Follow the voice setup in README.'})
        return
    model = None
    model_key = None
    for line in sys.stdin:
        tmp = None
        req = {}
        try:
            req = json.loads(line)
            if req.get('action') == 'quit':
                return
            name = req.get('model', 'base')
            if name not in MODELS:
                raise ValueError('Unsupported model')
            lang = req.get('language') or None
            if lang is not None and lang not in ('en', 'id'):
                raise ValueError('Unsupported language')
            if model_key != name:
                respond({'type': 'status', 'message': 'Loading model; first use may download files.'})
                model = WhisperModel(name, device='cpu', compute_type='int8')
                model_key = name
            audio = base64.b64decode(req['audio'], validate=True)
            if not audio or len(audio) > 16_000_000:
                raise ValueError('Invalid audio chunk')
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as f:
                tmp = f.name
                f.write(audio)
            segments, info = model.transcribe(tmp, language=lang, beam_size=3, vad_filter=True)
            text = ' '.join(segment.text.strip() for segment in segments).strip()
            respond({'type': 'result', 'id': req['id'], 'text': text, 'language': info.language})
        except Exception as exc:
            respond({'type': 'error', 'id': req.get('id') if isinstance(req, dict) else None, 'error': str(exc)[:500]})
        finally:
            if tmp:
                try:
                    os.unlink(tmp)
                except OSError:
                    pass

if __name__ == '__main__':
    main()
