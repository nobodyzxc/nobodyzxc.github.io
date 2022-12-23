import os, sys
from random import randint
from time import sleep

sec = 5
if len(sys.argv) > 1:
  sec = float(sys.argv[1])

while True:
  os.system("clear")
  pitch = randint(1, 3)
  if pitch == 1:
    print("")
    print(randint(3, 7))
    print(".")
  elif pitch == 2:
    print("")
    print(randint(1, 7))
    print("")
  elif pitch == 3:
    print(".")
    print(randint(1, 5))
    print("")
  sleep(sec)

"""
3 4 5 6 7
1 2 3 4 5 6 7
1 2 3 4 5
"""
