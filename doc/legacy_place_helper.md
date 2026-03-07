```ruby
module HomeHelper
    PlaceTypes = ["restaurant", "gas_station","movie_theater", "park", "supermarket", "pharmacy", "coffee_shop", "dentist", "doctor", "hospital", "spa", "hiking_area", "event_venue", "dog_park", "bowling_alley", "aquarium", "marina", "night_club", "tourist_attraction", "zoo", "casino", "fire_station", "police", "historical_landmark", "city_hall", "train_station", "subway_station", "light_rail_station", "bus_stop", "university", "school", "library", "art_gallery", "museum", "performing_arts_theater", "gym", "golf_course", "fitness_center", "playground", "ski_resort", "sports_club", "sports_complex", "stadium", "swimming_pool", "pet_store", "grocery_store", "hardware_store", "home_goods_store", "auto_parts_store", "bicycle_store", "book_store", "liquor_store", "home_improvement_store", "department_store", "clothing_store", "convenience_store", "discount_store", "shopping_mall", "barber_shop", "beauty_salon", "florist", "laundry", "veterninary_care"]

    def place_type_icon place
        #<i class="fa-solid fa-user-secret"></i>
        #<i class="fa-regular fa-bell"></i>
        # gas_station
        # movie_theater
        # park
        # restaurant
        # supermarket
        # pharmacy

        if place["types"].to_a.include?("restaurant")
            '<i class="fa-solid fa-utensils"></i>'.html_safe
        elsif place["types"].include?("gas_station")
            '<i class="fa-solid fa-gas-pump"></i>'.html_safe
        elsif place["types"].include?("dentist")
            '<i class="fa-solid fa-tooth"></i>'.html_safe
        elsif place["types"].include?("doctor")
            '<i class="fa-solid fa-stethoscope"></i>'.html_safe
        elsif place["types"].include?("hospital")
            '<i class="fa-solid fa-hospital"></i>'.html_safe
        elsif place["types"].include?("spa")
            '<i class="fa-solid fa-spa"></i>'.html_safe
        elsif place["types"].include?("gym")
            '<i class="fa-solid fa-dumbbell"></i>'.html_safe
        elsif place["types"].include?("barber_shop")
            '&#128136;'.html_safe
        elsif place["types"].include?("beauty_salon")
            '&#128135;'.html_safe
        elsif place["types"].include?("florist")
            '&#x1F490;'.html_safe
        elsif place["types"].include?("light_rail_station")
            '&#128648;'.html_safe
        elsif place["types"].include?("bus_stop")
            '&#128655;'.html_safe
        elsif place["types"].include?("train_station")
            '&#128649;'.html_safe
        elsif place["types"].include?("subway_station")
            '&#128643;'.html_safe
        elsif place["types"].include?("golf_course")
            '<i class="fa-solid fa-golf-ball-tee"></i>'.html_safe
        elsif place["types"].include?("aquarium")
            '<i class="fa-solid fa-fish"></i>'.html_safe
        elsif place["types"].include?("school")
            '<i class="fa-solid fa-school"></i>'.html_safe
        elsif place["types"].include?("hiking_area")
            '<i class="fa-solid fa-person-hiking"></i>'.html_safe
        elsif place["types"].include?("dog_park")
            '<i class="fa-solid fa-dog"></i>'.html_safe
        elsif place["types"].include?("coffee_shop")
            '<i class="fa-solid fa-mug-saucer"></i>'.html_safe
        elsif place["types"].include?("movie_theater")
            '<i class="fa-solid fa-ticket"></i>'.html_safe
        elsif place["types"].include?("bowling_alley")
            '<i class="fa-solid fa-bowling-ball"></i>'.html_safe
        elsif place["types"].include?("hardware_store")
            '<i class="fa-solid fa-hammer"></i>'.html_safe
        elsif place["types"].include?("event_venue")
            '&#127914;'.html_safe
        elsif place["types"].include?("fire_station")
            '&#128658;'.html_safe
        elsif place["types"].include?("police")
            '&#128659;'.html_safe
        elsif place["types"].include?("park")
            '<i class="fa-solid fa-tree"></i>'.html_safe
        elsif (place["types"].include?("supermarket") || place["types"].include?("grocery_store"))
            '<i class="bi bi-cart4"></i>'.html_safe
        elsif place["types"].include?("pharmacy")
            '<i class="bi bi-prescription2"></i>'.html_safe
        else
            '<i class="fa-solid fa-location-dot"></i>'.html_safe
        end
      end

    def params_to_search_types(params)
        Rails.logger.info(PlaceTypes & params.keys)
        PlaceTypes & params.keys
    end
end
```