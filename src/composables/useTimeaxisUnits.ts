import { computed } from "vue"
import useDayjsHelper from "./useDayjsHelper.js"
import provideConfig from "../provider/provideConfig.js"

export default function useTimeaxisUnits() {
  const { precision, highlightSundays } = provideConfig()
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()

  const upperPrecision = computed(() => {
    switch (precision?.value) {
      case "hour":
        return "day"
      case "day":
        return "month"
      case "date":
      case "week":
        return "month"
      case "month":
        return "year"
      default:
        throw new Error(
          "Precision prop incorrect. Must be one of the following: 'hour', 'day', 'date', 'week', 'month'"
        )
    }
  })

  const lowerPrecision = computed(() => {
    switch (precision.value) {
      case "date":
        return "day"
      case "week":
        return "isoWeek"
      default:
        return precision.value
    }
  })

  const displayFormats = {
    hour: "HH",
    date: "DD.MMM",
    day: "DD.MMM",
    week: "WW",
    month: "MMMM YYYY",
    year: "YYYY"
  }

  const timeaxisUnits = computed(() => {
    const upperUnits: { label: string; value?: string; date: Date; width?: string }[] = []
    const lowerUnits: { label: string; value?: string; date: Date; width?: string, highlight?: boolean }[] = []
    const upperUnit = upperPrecision.value === "day" ? "date" : upperPrecision.value
    const lowerUnit = lowerPrecision.value
    let currentUnit = chartStartDayjs.value.startOf(lowerUnit)
    const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes", true)
    let currentUpperUnit = chartStartDayjs.value
    let currentLowerUnit = chartStartDayjs.value

    while (currentLowerUnit.isSameOrBefore(chartEndDayjs.value)) {
      const endCurrentLowerUnit = currentLowerUnit.endOf(lowerUnit)
      const isLastItem = endCurrentLowerUnit.isAfter(chartEndDayjs.value)

      const lowerWidth = isLastItem
        ? (chartEndDayjs.value.diff(currentLowerUnit, "minutes", true) / totalMinutes) * 100
        : (endCurrentLowerUnit.diff(currentLowerUnit, "minutes", true) / totalMinutes) * 100

      lowerUnits.push({
        label: currentLowerUnit.format(displayFormats[precision?.value]),
        value: String(currentUnit[lowerUnit === "day" ? "date" : lowerUnit]()),
        highlight: highlightSundays?.value && currentUnit.day() == 0,
        date: currentLowerUnit.toDate(),
        width: String(lowerWidth) + "%"
      })
      currentLowerUnit = endCurrentLowerUnit
        .add(1, lowerUnit === "isoWeek" ? "week" : lowerUnit)
        .startOf(lowerUnit)
    }
    while (currentUpperUnit.isSameOrBefore(chartEndDayjs.value)) {
      const endCurrentUpperUnit = currentUpperUnit.endOf(upperUnit)
      const isLastItem = endCurrentUpperUnit.isAfter(chartEndDayjs.value)

      const upperWidth = isLastItem
        ? (chartEndDayjs.value.diff(currentUpperUnit, "minutes", true) / totalMinutes) * 100
        : (endCurrentUpperUnit.diff(currentUpperUnit, "minutes", true) / totalMinutes) * 100

      upperUnits.push({
        label: currentUpperUnit.format(displayFormats[upperUnit]),
        value: String(currentUpperUnit),
        date: currentUpperUnit.toDate(),
        width: String(upperWidth) + "%"
      })

      currentUpperUnit = endCurrentUpperUnit.add(1, upperUnit).startOf(upperUnit)
    }
    return { upperUnits, lowerUnits }
  })

  return {
    timeaxisUnits
  }
}
