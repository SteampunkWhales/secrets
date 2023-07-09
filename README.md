# Appbrew Secrets project
Some problems I encountered while coding with this unit that are not covered in the videos:
## Project Specific problems
* findOrCreate is no longer functioning
* the user object couldn't access the email info
## Nonspecifc problems
* mongoose no longer accepts callback functions
* mongoose uses async functions

I was able to solve these problems by reading the documentation for Mongoose, passport, and the passport Oauth module.  
Lines 70 - 98 are my solution for the findOrCreate module  
line 198 solves the email scope problem  
[This](https://mongoosejs.com/docs/api/model.html#Model.find()) Mongoose documentation page was the most helpful with understanding the new async syntax.  

Hopefully this is helpful for somebody else struggling with the class :)
