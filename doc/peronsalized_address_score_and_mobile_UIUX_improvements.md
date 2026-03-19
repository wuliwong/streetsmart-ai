# Personalized Address Score and Mobile UI/UX Improvements

## 1. Personalized Address Score

### Concept
I want to create a personalized streetsmarts score for an address which is based on the categories selected, the number of results, the distance to each result, and the rating of each place in the results. I think we can start using other apis to enrich our results as well. The first thing i see is that we need school ratings. It seems google places api doesn't have that? Other things i was wondering about is something like AllTrails. For outdoor enthusiasts. We are going to want to implement user profiles so you can save search preferences and addresses and stuff. We can work through that later. But i think this personalized scoring is great. It gives us that one special thing that no other site has. It could lead to us actually crawling listings and suggesting them based on their criterea. 



## 2. Mobile UI/UX Improvements

### Concept
On mobile, the current UI is surprisingly good without us even testing it. Two main things that jump out at me is we need to be able to have a 'handle' on the area where you enter the address and the categories so that we can drag it up and down to reveal more or less of the map.  Secondly, the interactions regarding showing details and the route line need to be fixed on mobile. When you tap on an icon you see the details but the route line is shown in a really buggy way. It seems when you tap away from that icon it shows the route line. We just have to get clear rules to how it happens. Right now we have a hover effect that doesn't work on mobile. I think that maybe tapping sets the icon as 'active' which shows the details and the route line. As a first attempt.