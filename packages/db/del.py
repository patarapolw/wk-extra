import os
import sys
from glob import glob
from datetime import datetime, timedelta

os.chdir(os.environ["BACKUP_ROOT"])

exit_status = 1

latest, *recent = sorted(glob("*.tar.gz"))[::-1]
latest_ctime = datetime.fromtimestamp(os.stat(latest).st_ctime)

previous_file_ctime = latest_ctime
for f in recent:
  ctime = datetime.fromtimestamp(os.stat(f).st_ctime)

  if latest_ctime - ctime < timedelta(days=1):
    pass  # Do not remove files within 1 day
  elif previous_file_ctime - ctime < timedelta(days=1):
    print(f"Deleting {f}")
    os.unlink(f)  # Remove less than 1 day apart
    exit_status = 0
  elif latest_ctime - ctime < timedelta(days=180):
    print(f"Deleting {f}")
    os.unlink(f)  # Remove older than 180 days
    exit_status = 0

  previous_file_ctime = ctime

sys.exit(exit_status)
