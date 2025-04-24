# Data Desktop

This application helps track any sort of data that I want to track. The current features implemented for tracking are the following:

- DEXA Scan information
- Bloodwork information
- Metrics that I want to be tracked
- Experiments tied to metrics that I want to be tracked
- Journaling that can be tied to metrics
- Time tracking that can be tied to metrics

The idea is to create a desktop application where all your data is stored locally, not encrypted, so that the user is able to aggregate any data they want to track.

Application is built for my own personal use, but may be useful to others if they want to follow the same process used by the application. Here are some considerations when using the application:

- DEXA Scan information is using data from BodySpec scans
- Bloodwork information requires you to input your blood markers before anything. This is because multiple lab providers have different bloodmarker names for the same blood marker. You have to decide which one you want to use and then track it accordingly
- For metrics and experiments, it's been tested to use true/false values. The other inputs have not been tested yet
- For journaling, the idea is to do those actions if only to give some time for yourself to reflect and also exercise some thinking muscles
- Time tracking is for you to understand how much time you spend on what task
- We recommend you add a PIN if you want to track data that should be private if you have the application opened, but leave the computer for a while, and you don't want people to look at it
  - Although visually, the data seems to be protected, if someone accessed your database, they will be able to view it

This application will be optimized as I find it a pain to do certain actions. Thanks for checking out the application!

- NOTE: Desktop application was created with a LOT of help from Claude 3.7 Sonnet. Some creative decisions were made by me, a lot were made by Claude 3.7 Sonnet. A lot of putting the code together is put together by me. (Unfortunately, Claude 3.7 Sonnet is still like a junior engineer that needs help occasionally to make things nice.)

## Project management

### TODOS

- PDF reports from data
- Add multi-relations work for table view, add/viewing/editing/importing (really, just need a overall tag multi feature since I think that's the only thing I'll be using multi-relations for for now)
- it would be nice if the options I chose for table view stayed when I updated a value
- update how the multiselect looks like in both data-form and data-table, right now it doesn't look good
- add a way in the backend to make a field unique
- add a way to cascade the deleting of a relation, i.e. if a bottom level relation is going to be deleted, do you also want to delete the lower level relations?
- for quick metric logger, on a calendar, allow the user to select however many metrics, and in the calendar, it will highlight that metric in a different color (automatically assigned) for the user to visually see when they did the metric
- in quick-metric-logger, improve the button layout for hide from calendar, edit/delete
- in bloodwork add inputs, add virtualization
- create end to end test to make sure the inputs are all working correctly
- see why the line chart doesn't show the x data for the one right next to the last x data description
- in the metrics data model, for customization, add a way to specify when a metric will show up, it could be that the metric repeats every x days, weeks, or months starting on a specific date
- when I press the power button, it has this error: `This wails.localhost page can’t be found No webpage was found for the web address: http://wails.localhost/dexa`, and it only happens sometimes - might be a wails bug?
- make the dashnoard able to be in like "specific card heights and card widths" or just hardcode it in
- add a way to enable/disable certain features from showing
- add a way to select the database you want to use
- update icons for the datasets

### IN PROGRESS

- add time tracking, and also tie it with a metric if possible
- in time tracking, in entries, show the category
- in time tracking, display a calendar view of the day of time tracking, and also a weekly view
- add a "time tracking" button at the header, and make it easy to track time, and make it reusable, so if I click in header, it pop ups, while also in the page, it can be used like normal
- allow the user to add a time entry without a description
- make the description kind of autocomplete
- tie time tracking and allow a user to select a metric to tie it to, to complete, metric can only be metric type time, so it should filter only for that metric, that's active
- when the datasets are loading on the dashboard page, show a visual indicator somewhere that it's loading and the user can't do anything while it loads
- adjust how the metric looks like for value number
- in daily tracker calendar view, it shows the dates in the wrong weekday slot
- in quick-metrics-logger, add a way to add notes
- in quick-metrics-logger, have a way to show the inactive metrics
- make the markdown CSS better looking
- in same question answers, only show the current day's question
- in question journaling, in the history list, for the filters, just provide the questions as a filter and allow the user to select it
- for some reason,, in daily tracking, the journaling metrics are not being categorized correctly
- in daily tracker dashboard summary, if the metric is a number, make it a better input (maybe a +/- and show the value?)
- add journaling information to onboarding modal and help modal
- add time tracking information to onboarding modal and help modal
- add time tracking info panel information

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
- Working on tracking feature, i.e. there's a bunch of random things I want to track if I did, it doesn't need to connect to a habit [DONE 2025-04-16]
- need to have a custom "add experiment" button in `experiment-list.tsx` [DONE 2025-04-16]
- need to add a way to edit some of the details in `experiment-detail.tsx` [DONE 2025-04-16]
- progress line chart in experiment-dashboard maybe showing the wrong date [DONE 2025-04-16]
- add a "add dexa scan" button in `dexa.tsx` [DONE 2025-04-16]
- add a "delete dexa scan" button [DONE 2025-04-16]
- add in bone density graphs for dexa [DONE 2025-04-16]
- add a "add bloodwork" button in `bloodwork.tsx` - this one should allow the user to choose a date, then it would populate all the bloodwork markers and allow the user to add a value next to it, then the function would first create a bloodwork date, then add the bloodwork results according to the data the user inputs [DONE 2025-04-17]
- add a "edit/delete bloodmarker" button [DONE 2025-04-17]
- add a "add bloodmarker" button [DONE 2025-04-17]
- add "edit bloodwork" and "delete bloodwork" buttons, component should be a selection of the date, and selection of the bloodmarker, then it allows for edit/delete [DONE 2025-04-17]
- in "add bloodwork", when I select an already existing dataset, I want it to populate the data that is already created, and disable them. I also want it to show the previous date's value [DONE 2025-04-17]
- update the daily tracking information to be what the feature actually is [DONE 2025-04-17]
- need to add info for dexa, bloodwork, experiments, daily tracking, quick metric logger [DONE 2025-04-17]
- there's a bug in daily tracking where in the popover, it still says there are more metrics that are visible (i.e. 5 metrics instead of the 4, because 1 metric shouldn't be counted, i.e. schedule_days = [-1]) [DONE 2025-04-18]
- add a streak for metrics somewhere, maybe in both calendar logs and also in quick metric logger? [DONE 2025-04-18]
- in `index.tsx`, add the latest DEXA scan summary information if there are any, and when a user clicks on it, it navigates user to DEXA scan route [DONE 2025-04-18]
- in `index.tsx`, add the latest summary of "in range" "out of range" bloodmarks (just a bar graph of those 2 are fine), and when a user clicks on it, it naviates user to bloodwork route [DONE 2025-04-18]
- in `index.tsx`, add a simple view for experiments that are active currently and how long it is until it ends, along with the dates [DONE 2025-04-18]
- in `index.tsx`, add a quick stat part where it shows the dataset information in a list view, with the information: dataset name, last updated, and how many total records, with a button that can navigate the user to the dataset route [DONE 2025-04-18]
- in `index.tsx`, add a "log a random metric", which allows a user to search for the metric and log it there that navigates the user to the metric route [DONE 2025-04-19]
- in quick metric logger, not sure if the logging is logging the right date in date selection calendar [DONE 2025-04-19]
- in `index.tsx`, add the daily metrics requiring logging, with a button that navigates to the full view, the calendar route [DONE 2025-04-19]
- in daily metric logging, cannot log item [DONE 2025-04-19]
- in add bloodwork, I can't type in the input [DONE 2025-04-19]
- in experiments dashboard summary, dexa scan summary, and bloodwork summary, make the "create your first experiment" link a button with indication that it sends user to another route [DONE 2025-04-20]
- in quick metric dashboard summary, when I click "search metrics", it doesn't close when I click out of it [DONE 2025-04-20]
- bug: cannot close "set up pin" modal when clicking "x" [DONE 2025-04-20]
- in bloodwork tracker, if no bloodmarkers are found, it should show "create bloodmarker" button [DONE 2025-04-20]
- in dexa scan, if no dexa scan is found, it should show "create dexa" button [DONE 2025-04-20]
- in quick metric dashboard summary, if no metrics are found, it should ask the user to make first metric [DONE 2025-04-20]
- in quick metric logger, if no metrics are found, it should show "create metric" button [DONE 2025-04-20]
- in daily tracking, if no metrics are found, it should show "create metric" button [DONE 2025-04-20]
- make sure when everything has no data, it looks decent with "add xxx" everywhere necessary [DONE 2025-04-20]
- add a "help" button that shows an onboarding modal [DONE 2025-04-20]
- add an onboarding modal to the application [DONE 2025-04-20]
- when a user first launched the application, it will show an onboarding modal, then once it's done, the security button will animate for 5 seconds for the user to click if they want to set up a pin [DONE 2025-04-20]
- in `quick-metrics-logger-dashboard-summary`, I cannot log a metric [DONE 2025-04-20]
- need to add `pt-4` in `reusable-summary.tsx` after `separator` [DONE 2025-04-20]
- add a "today" button for `quick-metrics-logger` [DONE 2025-04-20]
- adjust the `quick-metrics-logger` header to be next to the guide button [DONE 2025-04-20]
- in `experiment-detail`, when I click "edit-status" and change the status, it re-renders the modal [DONE 2025-04-20]
- in `body-anatomy-tab`, when I hover over a dot, it doesn't show a popover [DONE 2025-04-20]
- in `experiment-detail`, the progress change is showing the wrong data for progress (actually turns out when I toggle a metric on the front page, it's not attaching the experiment to it, so in actuality, it seems to be working fine) [DONE 2025-04-20]
- in `dexa-visualizations`, if the tabs are too long, it goes into the "guide" area [DONE 2025-04-20]
- when an experiment changed status to completed, it should allow the user to write down the end result of the experiment (also need to add a field to the data model) [DONE 2025-04-20]
- when an experiment is created, make the description instructions say "please write down the starting metrics of the experiment you are creating" [DONE 2025-04-20]
- in the experiment instructions/guide, make it explicit that when a user creates an experiment, they should add the starting "data" for them to try and improve, so that when they complete the experiment, they can write down the end result of it [DONE 2025-04-20]
- for gratitude journaling, allow user to log 3 gratitude journals, but if the user want to log more, they can [DONE 2025-04-22]
- for gratitude journaling, have 2 views - an input view for today for 3 entries and it only shows the entries for today, and a history view (don't allow editing or editing) [DONE 2025-04-22]
- for affirmation, allow a user to view the last created affirmation, and when the user updates it, it creates a new entry [DONE 2025-04-22]
- for creativity journal, have 2 views - an input view for today and it only shows the entry for today, and a history view [DONE 2025-04-22]
- for "daily questions", added a list somewhere locally [DONE 2025-04-22]
- for daily questions, have 3 views, an input view for today and it only shows the input for today, a "view history of the question answered for today", and  a view all entries [DONE 2025-04-22]
- add "gratitude jorunaling", "daily questions", "affirmation talking" and "creativity journal" as a metric, and format the metric UI for these things [DONE 2025-04-22]
- in quick-metric-logger, add a way to create pre-populated metrics that are tied to the journaling feature [DONE 2025-04-22]
- for gratitude journaling, tie a metric (pre-created) for 3 total entries, every new entry for that date increments the metric by 1 [DONE 2025-04-22]
- for affirmation, add a button that says "completed affirmation for the day" and tie it to a metric (pre-created) [DONE 2025-04-22]
- for creativity journal, when the user completes the entry, tie it to a metric (pre-created) and complete it (don't allow deleting or editing) [DONE 2025-04-22]
- for daily questions, tie a metric (pre-created) to be completed when a user enters an entry [DONE 2025-04-22]

### GAVE UP
