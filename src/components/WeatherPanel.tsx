'use client';

import { useState, useEffect } from 'react';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle,
  CloudFog, Wind, Droplets, Thermometer, ChevronDown
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

interface WeatherPanelProps {
  searchLocation: { lat: number; lng: number } | null;
}

function getCondition(code: number): { label: string; Icon: React.ElementType } {
  if (code === 0) return { label: 'Clear', Icon: Sun };
  if (code <= 3) return { label: 'Partly Cloudy', Icon: Cloud };
  if (code <= 48) return { label: 'Foggy', Icon: CloudFog };
  if (code <= 55) return { label: 'Drizzle', Icon: CloudDrizzle };
  if (code <= 67) return { label: 'Rain', Icon: CloudRain };
  if (code <= 77) return { label: 'Snow', Icon: CloudSnow };
  if (code <= 82) return { label: 'Showers', Icon: CloudRain };
  if (code <= 86) return { label: 'Snow Showers', Icon: CloudSnow };
  return { label: 'Thunderstorm', Icon: CloudLightning };
}

export function WeatherPanel({ searchLocation }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!searchLocation) {
      setWeather(null);
      return;
    }

    const { lat, lng } = searchLocation;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        setWeather({
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          weatherCode: c.weather_code,
        });
      })
      .catch(() => setWeather(null));
  }, [searchLocation]);

  if (!weather) return null;

  const { label, Icon } = getCondition(weather.weatherCode);

  return (
    <section className="relative z-10 rounded-[24px] border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-lg sm:p-5 transition-all hover:bg-black/60 hover:border-white/20">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-end justify-between gap-3 mb-1 group"
      >
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Current Weather
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Live conditions for this location.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-white">
            {weather.temperature}°F
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Icon size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-base leading-tight">{weather.temperature}°F</p>
              <p className="text-slate-400 text-xs">{label} · Feels like {weather.feelsLike}°F</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <Droplets size={14} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Humidity</p>
                <p className="text-sm font-semibold text-white">{weather.humidity}%</p>
              </div>
            </div>
            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <Wind size={14} className="text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Wind</p>
                <p className="text-sm font-semibold text-white">{weather.windSpeed} mph</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
