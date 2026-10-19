#!/usr/bin/env python3
import hashlib,json,os
from pathlib import Path
service=os.environ['SERVICE'];sha=os.environ['GITHUB_SHA']
migrations=Path('src/main/resources/db/migration')
h=hashlib.sha256()
if service=='backend':
    for p in sorted(migrations.glob('*.sql')):
        h.update(p.name.encode());h.update(b'\0');h.update(p.read_bytes());h.update(b'\0')
archive=Path('image.tar.gz')
with archive.open('rb') as f: digest=hashlib.file_digest(f,'sha256').hexdigest()
Path('metadata.json').write_text(json.dumps(dict(service=service,sha=sha,archive_sha256=digest,migration_sha256=h.hexdigest())))
