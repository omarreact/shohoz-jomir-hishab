"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { landRecordsApi } from "../api";
import type { Division, District, Upazila, Survey, Mouza, KhatianDetails, KhatianPage, KhatianSearchInput } from "../types";

export function useSurveyKhatian() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [mouzas, setMouzas] = useState<Mouza[]>([]);
  const [khatians, setKhatians] = useState<KhatianPage | null>(null);
  const [selectedKhatian, setSelectedKhatian] = useState<KhatianDetails | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const requestIds = useRef<Record<string, number>>({});
  const lastKhatianSearch = useRef<KhatianSearchInput | null>(null);
  const nextId = (key: string) => (requestIds.current[key] = (requestIds.current[key] ?? 0) + 1);
  const isLatest = (key: string, id: number) => requestIds.current[key] === id;
  const run = useCallback(async <T,>(key: string, task: () => Promise<T>, onData: (value: T) => void) => {
    const id = nextId(key); setLoading((s) => ({ ...s, [key]: true })); setError(null);
    try { const value = await task(); if (isLatest(key, id)) onData(value); }
    catch (e) { if (isLatest(key, id) && !(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : "ডেটা লোড করা যায়নি"); }
    finally { if (isLatest(key, id)) setLoading((s) => ({ ...s, [key]: false })); }
  }, []);

  useEffect(() => { void run("divisions", landRecordsApi.divisions, setDivisions); }, [run]);
  const loadDistricts = useCallback((code: string) => run("districts", () => landRecordsApi.districts(code), setDistricts), [run]);
  const loadUpazilas = useCallback((code: string) => run("upazilas", () => landRecordsApi.upazilas(code), setUpazilas), [run]);
  const loadSurveys = useCallback((district: string, upazila: string) => run("surveys", () => landRecordsApi.surveys(district, upazila), setSurveys), [run]);
  const loadMouzas = useCallback((input: Parameters<typeof landRecordsApi.mouzas>[0]) => run("mouzas", () => landRecordsApi.mouzas(input), setMouzas), [run]);
  const loadKhatians = useCallback((input: KhatianSearchInput) => {
    lastKhatianSearch.current = input;
    return run("khatians", () => landRecordsApi.khatians(input), setKhatians);
  }, [run]);
  const loadKhatian = useCallback((surveyKey: string, id: number, context?: Parameters<typeof landRecordsApi.khatian>[2]) => {
    const search = lastKhatianSearch.current;
    const rememberedContext = search && search.surveyKey === surveyKey
      ? { owner: search.owner, dagNumber: search.dagNumber, jlNumberId: search.jlNumberId }
      : undefined;
    return run("khatian", () => landRecordsApi.khatian(surveyKey, id, context ?? rememberedContext), setSelectedKhatian);
  }, [run]);
  return { divisions, districts, upazilas, surveys, mouzas, khatians, selectedKhatian, loading, error, loadDistricts, loadUpazilas, loadSurveys, loadMouzas, loadKhatians, loadKhatian, setDistricts, setUpazilas, setSurveys, setMouzas, setKhatians, setSelectedKhatian, clearError: () => setError(null) };
}
