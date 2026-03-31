require 'tty-prompt'
require 'tty-progressbar'
require 'down'
require 'fileutils'
require 'pastel'

pastel = Pastel.new
prompt = TTY::Prompt.new

# Define the primary open data sources for school performance and geocoding
DATASETS = {
  "Urban Institute: CCD School Directory (2022-23 CSV)" => "https://educationdata.urban.org/csv/ccd/school_ccd_directory_2022.csv",
  "Urban Institute: School Enrollment Data (2022 CSV)" => "https://educationdata.urban.org/csv/ccd/school_ccd_enrollment_2022.csv",
  "NCES EDGE: Public School Geo-Coordinates (22-23 ZIP)" => "https://nces.ed.gov/programs/edge/data/EDGE_GEOCODE_PUBLICSCH_2223.zip",
  "NCES EDGE: School District Boundaries (Shapefiles ZIP)" => "https://nces.ed.gov/programs/edge/data/EDGE_GEOCODE_DISTRICT_2223.zip"
}

puts pastel.bold.cyan("\n--- StreetSmarts Data Downloader ---")

# 1. Select Dataset(s)
selected_names = prompt.multi_select("Select datasets to download:", DATASETS.keys, cycle: true, marker: "→")

if selected_names.empty?
  puts pastel.red("No datasets selected. Exiting.")
  exit
end

# 2. Select Destination
dest_dir = prompt.ask("Where should I save them?", default: "./school_data")
FileUtils.mkdir_p(dest_dir)

# 3. Download Logic
selected_names.each do |name|
  url = DATASETS[name]
  file_name = File.basename(url)
  target_path = File.join(dest_dir, file_name)

  puts "\nFetching: #{pastel.yellow(name)}"
  
  bar = TTY::ProgressBar.new("[:bar] :percent :eta", total: 100, width: 40, complete: "█", incomplete: "░")

  begin
    # Down gem handles the progress tracking easily
    Down.download(
      url,
      destination: target_path,
      content_length_proc: ->(total) { bar.update(total: total) if total && total > 0 },
      progress_proc: ->(current) { bar.current = current }
    )
  rescue => e
    puts pastel.red("Error downloading #{name}: #{e.message}")
    next
  end
end

# 4. Happy UI Element
puts "\n" + pastel.bold.green("✔ All downloads completed successfully!")
puts pastel.green("Files are located in: #{File.expand_path(dest_dir)}")
puts "✨ 🚀 Happy Building! 🚀 ✨\n\n"