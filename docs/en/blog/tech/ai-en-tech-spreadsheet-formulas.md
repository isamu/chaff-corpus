# Five Spreadsheet Formulas That Will Save You Time Every Week

If you work in an office, there's a good chance you spend part of every week copying numbers between spreadsheets, adding things up by hand, or scrolling through long lists looking for one row. You don't need to be a "spreadsheet person" to stop doing that. These five formulas cover most of what office staff need, and they work the same way in Excel and Google Sheets.

## 1. SUMIF: add up only the rows you care about

Say you have a list of expenses with a column for the department and a column for the amount. You want the total for Marketing only.

```
=SUMIF(A2:A200, "Marketing", C2:C200)
```

This reads as: look down column A, and wherever it says "Marketing", add up the matching number in column C.

You can point to a cell instead of typing the name, which makes it easy to build a small summary table:

```
=SUMIF(A2:A200, E2, C2:C200)
```

## 2. COUNTIF: count how many times something appears

How many orders are still marked "Pending"?

```
=COUNTIF(D2:D500, "Pending")
```

It works just like SUMIF, but it counts the rows instead of adding up numbers.

## 3. XLOOKUP: find information from another list

This is the one that saves the most time. Imagine you have a list of employee IDs and you need each person's department, which lives in a different sheet.

```
=XLOOKUP(A2, Staff!A:A, Staff!C:C, "Not found")
```

In plain words: take the ID in A2, find it in column A of the Staff sheet, and bring back what's in column C on the same row. If it isn't there, show "Not found".

If your version of Excel is older and doesn't have XLOOKUP, VLOOKUP does a similar job:

```
=VLOOKUP(A2, Staff!A:C, 3, FALSE)
```

Always put FALSE at the end. Without it, VLOOKUP can return a close match instead of the right one, and you won't notice.

## 4. IF: let the spreadsheet make simple decisions

Want to flag invoices over $1,000 for approval?

```
=IF(C2>1000, "Needs approval", "OK")
```

The formula checks the condition first. If it's true, you get the first answer; if not, the second.

## 5. TEXT: make dates and numbers look the way you want

When you combine a date with text, spreadsheets often show a strange number like 46342. TEXT fixes that:

```
="Due on " & TEXT(B2, "mmmm d, yyyy")
```

This gives you something like "Due on November 15, 2026".

## A few tips before you start

- **Lock your ranges when copying formulas.** Add dollar signs, like `$A$2:$A$200`, so the range doesn't shift when you drag the formula down.
- **Check one result by hand.** The first time you use a new formula, work out one answer yourself to make sure it's doing what you expect.
- **Keep your data tidy.** Formulas work best when each column holds one kind of information and there are no blank rows in the middle of a list.

You don't have to learn all five at once. Pick the one that matches a task you do every week, try it on a copy of your file, and go from there.
