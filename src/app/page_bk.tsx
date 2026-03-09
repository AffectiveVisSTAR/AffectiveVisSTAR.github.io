"use client";

import {
  reset,
  setValue,
} from "@/lib/features/example/exampleSlice";
import Button from "@/lib/features/ui/Button";
import Checkbox from "@/lib/features/ui/Checkbox";
import Input from "@/lib/features/ui/Input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useState } from "react";

export default function Home() {
  const dispatch = useAppDispatch();
  const value = useAppSelector((state) => state.example.value);
  const [check, setCheck] = useState(false);
  const [textValue, setTextValue] = useState<string | number | null>(null);
  const [ageValue, setAgeValue] = useState<string | number | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <main className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Redux Toolkit Example
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Example Web-App
          </h1>
          <p className="text-base text-zinc-600">
            This page reads and updates global state from the Redux store.
          </p>
        </header>

        <section className="mt-10 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-zinc-500">Current value</p>
              <p className="text-4xl font-semibold text-zinc-900">{value}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button label="Update" onClick={() => dispatch(setValue(textValue as string))} />
            {/* <button
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              onClick={}
              type="button"
            >
              Update
            </button> */}
            <button
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
              onClick={() => dispatch(reset())}
              type="button"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Checkbox label={"Checkbox Test"} checked={check} setChecked={setCheck} />
            <Input type="text" label={"Name"} value={textValue} setValue={setTextValue} description={"Write your name."} />
            <Input type="number" label={"Age"} value={ageValue} setValue={setAgeValue} description={"Write your age."} />
          </div>
        </section>
        <section className="border-t mt-4 pt-2">
          <h1 className="text-3xl font-semibold tracking-tight">Extra Pages</h1>
          <a className="text-blue-500" href="/table">Table Test</a>
        </section>
      </main>
    </div>
  );
}
