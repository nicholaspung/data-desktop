# Journaling Desktop

- Desktop application was created with a LOT of help from Claude 3.7 Sonnet. Some creative decisions were made by me, a lot were made by Claude 3.7 Sonnet.

  - Total time it took to create a satisfactory v0.0.1 was 12 hrs 43 mins
    - Spent 3 days consecutively to create application with a lot of breaks in between
  - It took 2 hrs 11 mins in order to get the application to release probably on GitHub Releases
    - Spent 1 day to figure out build process for GitHub releases

## Project management

### TODOS

- Figure out if Claude can help me change the complete styling of the shadcn components to look a little nicer (to match logo color scheme would be nice)
- See if there's a way to generate a "SDK" for the Wails bindings after they are created
- See if there's a way to generate types from the Go backend models in Typescript
- Double check if the "Import all" button works
- Figure out how to distribute built objects on a website
- To figure out how to push updates to clients without asking them to download a new application
- Fix list padding for markdown rendering
- Fix minor bug with affirmation current streak display "1 day streak" even though it was supposed to be "2 day streak" but after I complete it, it becomes correct again
- Fix affirmation log completed at time? In logs, it's completely off, but not sure if it's a display issue or underlying data issue

### IN PROGRESS

### DONE

- Change questions so that if I answer a question, it shows that question and answer, not another random question [DONE 2025-03-18]
- Disable "New question" button if I already answered for the day [DONE 2025-03-18]
- Start changing the structure of the project folder to be a little more maintainable [DONE 2025-03-18]
- Add different routes to the application and place the components there [DONE 2025-03-18]
- Add a way to add more questions [DONE 2025-03-18]
- Add an "Export all data" button that exports to CSV [DONE 2025-03-18]
- Add a calendar component that shows if I did my affirmation, and if I answered a journal question [DONE 2025-03-18]
- For questions, if there's a history, add a button that allows for comparison view between today's question, and the selected question [DONE 2025-03-18]
- Add a gratitude journal section [DONE 2025-03-19]
- Add a creativity journal section [DONE 2025-03-19]
- Add some sample affirmations that help with self worth tied to action and improvement, as well as affirmations that ties self worth as is [DONE 2025-03-19]
- Add more questions to load up in the beginning [DONE 2025-03-19]
- Add GitHub Actions workflow to build into Windows/Mac/Linux [DONE 2025-03-20]

### GAVE UP

- See if there's a way to choose the database it loads
- Is there a way to bundle the SQLite database in the application, rather than it having 2 files in order to work, i.e. application and database (thought PocketBase did it, but I remembered incorrectly)
