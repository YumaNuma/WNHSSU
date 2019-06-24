# Williamsville North High School Event System
  I made this system cause I was batshit going crazy not knowing what events there were or who was working them or if someone was already working them. So I just decided to make my own system and hopefully have it implemented into the stage crew. This was developed by me, Zaid Arshad, through tears and my last remaining brain cells right after finals week. This is literally the messiest thing i've created and I'll try to clean it up and refactor it as much as I can. I welcome contributors cause I am far from perfect and anyone is welcome to download this and use it for their own school or whatever.


## Description:
  This the backend of the system which creates event files and stores the list of all the events through the use of POST and GET requests. 
  The post request has the following parameters:
  `id,
  name (event name),
  month,
  day,
  time,
  pn (positions needed) (only has 3 allowed values, 1 = sound only, 2 = sound and lights, 3 = sound and lights and backstage)
  Example of a valid POST url is http://hostname:3000/events/addnew?id=1242&?name=biggiecheeselmao&?month=09&?day=23&?time=5:30?pn=1
  `
