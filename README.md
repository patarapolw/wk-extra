# wk-extra

Additional features for <https://www.wanikani.com>

A Git LFS extension makes git-crypt work on top of Git LFS. The following should be added to your `.git/config`:

```
[diff "cat"]
	textconv = cat
[lfs "extension.git-crypt"]
	clean = git-crypt clean
	smudge = git-crypt smudge
	priority = 0
```

To filter files with git-crypt from now on, set their filter & diff attributes to filter=lfs diff=git-crypt, and leave their merge attribute unspecified.

After cloning a repository with encrypted files, unlock with GPG:

```
git-crypt unlock
```
