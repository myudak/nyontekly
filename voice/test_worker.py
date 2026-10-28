import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

WORKER = Path(__file__).with_name('worker.py')

class WorkerProtocolTest(unittest.TestCase):
    def test_model_is_reused_and_results_are_correlated(self):
        with tempfile.TemporaryDirectory() as temp:
            Path(temp, 'faster_whisper.py').write_text('''\nclass Segment:\n text = " hello world "\nclass Info:\n language = "en"\nclass WhisperModel:\n def __init__(self, *args, **kwargs): pass\n def transcribe(self, path, **kwargs):\n  with open(path, "rb") as f: assert f.read() == b"test audio"\n  return [Segment()], Info()\n''')
            env = {**os.environ, 'PYTHONPATH': temp}
            audio = base64.b64encode(b'test audio').decode()
            requests = [{'id': 1, 'model': 'tiny', 'language': 'en', 'audio': audio}, {'id': 2, 'model': 'tiny', 'language': '', 'audio': audio}, {'action': 'quit'}]
            proc = subprocess.run([sys.executable, str(WORKER)], input=''.join(json.dumps(x)+'\n' for x in requests), text=True, capture_output=True, env=env, timeout=10, check=True)
            messages = [json.loads(line) for line in proc.stdout.splitlines()]
            self.assertEqual([m['type'] for m in messages], ['status','result','result'])
            self.assertEqual([(m['id'],m['text']) for m in messages[1:]], [(1,'hello world'),(2,'hello world')])
    def test_rejects_unsupported_model(self):
        with tempfile.TemporaryDirectory() as temp:
            Path(temp, 'faster_whisper.py').write_text('class WhisperModel: pass\n')
            env = {**os.environ, 'PYTHONPATH': temp}
            proc = subprocess.run([sys.executable, str(WORKER)], input=json.dumps({'id':3,'model':'bad','audio':''})+'\n', text=True, capture_output=True, env=env, timeout=10, check=True)
            message=json.loads(proc.stdout)
            self.assertEqual(message['type'],'error')
            self.assertEqual(message['id'],3)

if __name__ == '__main__': unittest.main()
