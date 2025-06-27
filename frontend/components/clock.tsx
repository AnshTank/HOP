"use client"

import { useState, useEffect } from "react"

export default function Clock() {
  const [time, setTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString())
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [])

  return <span className="font-mono tabular-nums">{time}</span>
}
