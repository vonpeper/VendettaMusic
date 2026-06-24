"use client"

import { useEffect } from "react"

export function ThemeManager() {
  useEffect(() => {
    // Add admin-theme and light mode classes to body / documentElement
    const bodyClass = document.body.classList
    const htmlClass = document.documentElement.classList

    // Apply light theme classes for admin
    bodyClass.add("admin-theme")
    
    // Check if html has 'dark' class and temporarily remove it
    const hadDark = htmlClass.contains("dark")
    if (hadDark) {
      htmlClass.remove("dark")
    }

    return () => {
      // Cleanup: revert body and html class on unmount
      bodyClass.remove("admin-theme")
      if (hadDark) {
        htmlClass.add("dark")
      }
    }
  }, [])

  return null
}
