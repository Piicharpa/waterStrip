// DateAnalyzer.ts
export const DateAnalyzer = (stripData: any[]) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return stripData.filter((strip) => {
    const date = new Date(strip.s_date);
    return (
      !isNaN(date.getTime()) &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });
};
