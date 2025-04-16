# Data Desktop

- Desktop application was created with a LOT of help from Claude 3.7 Sonnet. Some creative decisions were made by me, a lot were made by Claude 3.7 Sonnet.

## Project management

### TODOS

- PDF reports from data
- Add multi-relations work for table view, add/viewing/editing/importing (really, just need a overall tag multi feature since I think that's the only thing I'll be using multi-relations for for now)
- it would be nice if the options I chose for table view stayed when I updated a value
- update how the multiselect looks like in both data-form and data-table, right now it doesn't look good
- add time tracking, and also tie it with a metric if possible
- add a way in the backend to make a field unique
- update the daily tracking information to be what the feature actually is

### IN PROGRESS

- in bloodwork, add a "bloodwork" filter, which is the date filter, allow selection
- progress line chart in experiment-dashboard maybe showing the wrong date
- add in bone density graphs for dexa
- Working on tracking feature, i.e. there's a bunch of random things I want to track if I did, it doesn't need to connect to a habit
- need to have a custom "add experiment" button in `experiment-list.tsx`
- need to add info for dexa, bloodwork, experiments, daily tracking, quick metric logger
- add a "add dexa scan" button in `dexa.tsx`
- add a "add bloodwork" button in `bloodwork.tsx` - this one should allow the user to choose a date, then it would populate all the bloodwork markers and allow the user to add a value next to it, then the function would first create a bloodwork date, then add the bloodwork results according to the data the user inputs

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
- Change bulk import into a button that opens a modal/ just made it an extra tab [DONE 2025-04-05]
- Test if export CSV button works with the relations tables, and if it doesn't, make it work with the display field for the id [DONE 2025-04-05]
- In table filter, if there's a relational field, display field, make it search that instead [DONE 2025-04-05]
- Create a script to transform my current CSV with blood result data to fit with the relations in the app [DONE 2025-04-05]
- Make relations work for batch entry [DONE 2025-04-05]
- In the bloodwork transform script, I need to include units in there, and add it to the secondary display field so that it imports correctly [DONE 2025-04-05]
- I need the import CSV feature to work with the secondary display field is at the end of the name, the ending parentheses show up (probably a bigger change that I realize) - seems like this is working now [DONE 2025-04-05]
- It seems like the input forms in single edit/multi edit in data-table isn't working [DONE 2025-04-06]
- refactor the data fetching code so that it all loads in one component, and also gets stored in TanStack store, and when there's modifications to data, it mostly just edits it on the client-side (still need to go through bloodwork components, and also updated `batch-entry-table` and `editable-cell` stuff with the relational fields) (might also try adding the TanStack store functions in the `ApiService`) (it looks like the reason why it's not displaying correctly is because the loading of data is not working correctly) [DONE 2025-04-07]
- when trying to edit a relational field in edit mode in data table, it doesn't work correctly - looks like regular date components also don't [DONE 2025-04-07]
- add a refresh button in each `generic-data-table.tsx` that will update TanStack store [DONE 2025-04-07]
- add a refresh button on `index.tsx` to refresh the datasets there [DONE 2025-04-07]
- Start working on bloodwork feature [DONE 2025-04-08]
- Create bloodwork visualization by grouping together blood marker categories, and display the blood results in a tiny graph, where if the marker is within the optimal reference, that it's green, otherwise, it's grey
- If reference and optimal is 0 - 0, then that means value is just there (unsure of what to call it) - also add this as a filter [DONE 2025-04-08]
- for text values, figure out a way to display them next to the graph cards looking nice [DONE 2025-04-08]
- create a "body" diagram for DEXA where I can hover over a body part and it will tell me the details for that area [DONE 2025-04-08]
- in add form, also make the boolean values in a column view [DONE 2025-04-10]
- add a "select" type visual if I want to include hard coded values for the select fields [DONE 2025-04-10]
- refactor dialog components [DONE 2025-04-10]
- add a private button where if I input a PIN, then I can see the values [DONE 2025-04-10]
- add a pin/password in order to view private values [DONE 2025-04-10]
- add a reset pin/password in order to change pin/password [DONE 2025-04-10]
- automatically disable private view after 1 minute [DONE 2025-04-10]
- remove "habits" from the backend and frontend [DONE 2025-04-11]
- in daily tracker view, figure out a way to associate the metric with the experiment that is going on that has the metrics in it, without having to select the experiment to tie it too [DONE 2025-04-11]
- adjust how the "complete" metric shows up [DONE 2025-04-11]
- adjust how the card "saves", rather than clicking an overall save button, have the save button either in the card or automatically do it via a debounced function [DONE 2025-04-11]
- add daily log view table component that I don't need to dig in order to view the data [DONE 2025-04-11]
- add a large calendar view of the tracked metrics [DONE 2025-04-11]
- bloodwork graphs, when I click "out of range", it still shows the "no range set" values [DONE 2025-04-12]
- in daily-tracker-calendar-view.tsx, the savechanges function needs updating - sometimes the log attaches to an experiment, but sometimes it doesn't [DONE 2025-04-12]
- in experiment-dashboard.tsx, combine the header components together [DONE 2025-04-13]
- in metrics, add a way to customize when the metric will show up (i.e. monday/wednesday) [DONE 2025-04-13]
- only show a metric log if the metric was created on the date of or after [DONE 2025-04-13]
- in metrics, also add an "end" date which will archive that metric and the metric won't show up after that date [DONE 2025-04-13]
- start putting all the datasets into a single tab, and then putting all the visuals I can about into their own place [DONE 2025-04-14]
- in daily tracker view, if a metric is private, only show it when the "show private" button input with PIN is completed [DONE 2025-04-14]
- in experiments, if a metric is private, only show it when the "show private" button input with PIN is completed [DONE 2025-04-14]
- add a simple "instructions" panel on how to use things for now since UI isn't intuitive [DONE 2025-04-15]
- need to have an "info" button on how to use "daily tracking" and "experiments" [DONE 2025-04-15]
- need to have a "add metric" button in `daily-tracker-calendar-view.tsx` [DONE 2025-04-15]
- metric frequency custom needs to figure out how to showcase that, or just make a specific metric form for it and display it somewhere [DONE 2025-04-15]
- need to figure out how to add a random metric [DONE 2025-04-15]
- in daily tracker, would be nice if I could view specific metrics via a filter on the calendar without seeing a progress bar [DONE 2025-04-15]
- in `daily-tracker-calendar-view.tsx`, need to update the logic in there so that if `schedule_days` is `-1`, it doesn't affect the progress shown in the calendar, and also not show up in the logs below [DONE 2025-04-16]
- in `daily-tracker-calendar-view.tsx`, need to be able to edit/delete a metric that is showing up in the logs section [DONE 2025-04-16]

### GAVE UP
