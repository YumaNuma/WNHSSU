# Event System for Stage Crews
  This system allows Crew Chief to create an event, allow Crew Members to sign up for events, and see an up-to-date list of events all from a mobile device or PC!
  The frontend is semi-mobile friendly, but all features 100% work on both mobile and PC.
  
 
## How to Use:
  - Clone using Link
  - Configure port (Default is 80, change to 443 for strict HTTPS)
  - Website should be hosted at http://127.0.0.1/
  - Create events at: http://127.0.0.1/createevent
  - Event List at: http://127.0.0.1/events

LIVE DEMO AT [HERE](http://138.197.60.43/)
  
## Current Features:
  - Sign up for events
  - Create event (Crew Chief only)
  - See list of events (Sorted by Recently Added)
  - See details of events & displays who is working events
  - List of events automatically updates as soon as event is created by Crew Chief
  - Automatically rejects requests to sign up for spot that is already taken
  - Delete event page (Crew Chief only)
  - Automatically rejects duplicate sign ups, and same person sign ups for multiple positions 
  - Automatically hides unneeded positions

## Future Features:
  - [ ] Unsign up for events
  - [ ] Waitlist

## Backstory:
  I made this system cause I was going crazy not knowing what events there were or who was working them or if someone was already working them. So I just decided to make my own system and hopefully have it implemented into the stage crew. This was developed by me, Zaid, through tears and my last remaining brain cells right after finals week. This could use a bit of refactoring, which I will attempt my best to do. I welcome contributors cause I am far from perfect and anyone is welcome to download this and use it for their own school or whatever.


## Params:
  This the backend of the system which creates event files and stores the list of all the events through the use of POST and GET requests. 
  The post request has the following parameters:
  `id,
  name (event name),
  month,
  day,
  time,
  pn (positions needed) (only has 3 allowed values, 1 = sound only, 2 = sound and lights, 3 = sound and lights and backstage),
  location,
  Example of a valid POST url is http://hostname:3000/events/addnew?id=1242&?name=biggiecheeselmao&?month=09&?day=23&?time=5:30?pn=1
  `
  
 
