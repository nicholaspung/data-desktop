# Journaling Desktop

- Desktop application was created with a LOT of help from Claude 3.7 Sonnet. Some creative decisions were made by me, a lot were made by Claude 3.7 Sonnet.

## Project management

### TODOS

- PDF reports from data
- Make relations work for batch entry
- Test if export CSV button works with the relations tables
- Creat a script to transform my current CSV with blood result data to fit with the relations in the app
- In table filter, if there's a relational field, display field, make it search that instead
- Change bulk import into a button that opens a modal

### IN PROGRESS

- Start working on bloodwork feature

### DONE

- Fix form component [DONE 2025-03-31]
- Add edit/delete buttons to view data component [DONE 2025-03-31]
- When you add an item, have it open up the view data tab [DONE 2025-03-31]
- Make the add data section save a local copy [DONE 2025-03-31]
- Add a clear button to add data section [DONE 2025-03-31]
- In add data section, add a "cancel" button [DONE 2025-03-31]
- In view data, when you click on an item, have it also have a delete and clear button [DONE 2025-03-31]
- Also make the edit section in view data be saved locally [DONE 2025-03-31]
- When finished editing or clicked cancelled, remove data for the edit section and the add data section [DONE 2025-03-31]
- In view data, remove the edit and delete button, and make the delete button where the import csv button is (also that button doesn't work) [DONE 2025-04-01]
- In view data, make the items also selectable, so that if I click a checkbox, for multiple items, I can delete all of them at the same time [DONE 2025-04-01]
- In add entry, when I add an entry, it should then reset everything [DONE 2025-04-01]
- In add entry, reset doesn't work, it should reset everything [DONE 2025-04-01]
- In add entry, cancel doesn't work, it should reset everything [DONE 2025-04-01]
- Pagination is not working in table component [DONE 2025-04-01]
- Add freeze row 1 and col 1 to table, make width according to data field, changed mode to toggle mode between view/edit/delete [DONE 2025-04-03]
- Pagination component somehow making double scrollbar (should also abstract out pagination component in `data-table`) [DONE 2025-04-03]
- Made editable-data-table be able to be in view, single edit, multi edit, and delete mode [DONE 2025-04-03]
- Add multiple data entries as an option [DONE 2025-04-03]
- In "Import CSV" section, view the data preview first before importing the data [DONE 2025-04-03]
- Somehow, the edit entries disappeared in "View data" [DONE 2025-04-03]
- Add data form has a weird visual bug at the submit portion [DONE 2025-04-03]
- Do I want the batch entry tab to also save data locally, until reset? [DONE 2025-04-03]
- In generic-data-page, if there are more than 4 tabs, it looks weird [DONE 2025-04-03]
- Add an export CSV button [DONE 2025-04-04]
- Currently, database has duplicate datasets, probably because it was initialized with old datasets that need changing (looks like they are UUID dataset ids? so need to go into the datasets to find them in order to remove them) [DONE 2025-04-05]
- In `index.tsx`, modify the url so that if a dataset.id has `blood`, it goes to `bloodwork` [DONE 2025-04-05]

### GAVE UP
