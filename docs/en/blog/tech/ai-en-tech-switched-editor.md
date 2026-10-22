# I went back to a plain text editor for a month

For about six years, I wrote everything in a full-featured IDE. Code, notes, even grocery lists, if I'm being honest. In September I switched to a plain text editor with almost no plugins, just to see what would happen. I'd been feeling like the tool was doing more of my thinking than I was.

Here's what a month of that was like.

## The first week was rough

I didn't realize how much I leaned on autocomplete until it was gone. I kept typing the first three letters of a function name and waiting. Nothing came. I had to actually remember what I'd called things, which, it turns out, I often didn't.

Jumping to a definition was the other big one. In the IDE, I'd click on a function and land where it was defined. Without that, I was grepping. A lot. I probably ran `grep -rn` more in that first week than in the previous year.

I was slower. Noticeably. A small change to our billing module that would normally take me an hour took most of an afternoon.

## Then it got interesting

Somewhere in the second week, I started reading code differently. Because I couldn't jump around instantly, I'd open a file and read it top to bottom before changing anything. I started noticing things: a helper function nobody used anymore, two modules that did almost the same thing, a comment that described code that had been rewritten long ago.

I also started keeping a small notes file open on the side, with the names of the important functions and where they lived. Writing it out by hand forced me to understand how the pieces fit together, in a way that clicking through never had.

## What I missed the whole time

Some things never stopped being annoying:

- **Renaming across files.** Doing it with search and replace is nerve-racking. I broke the build twice.
- **Type errors.** Finding out about them when I ran the tests, instead of as I typed, was just worse. No upside there.
- **Debugging.** Print statements work, but a real debugger is better, and I'm not going to pretend otherwise.

## Where I ended up

I'm back in the IDE now. But I changed a few things. I turned off inline autocomplete suggestions and only call them up when I want them. And when I'm working in a part of the codebase I don't know well, I read the files first before I start jumping around.

The month didn't convince me that plain editors are better. It convinced me that I'd stopped paying attention, and that the tool had made it easy not to. That was worth an afternoon or two of grepping.
