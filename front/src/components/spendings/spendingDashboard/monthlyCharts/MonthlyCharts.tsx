import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import dashboardText from "@components//spendings/config/text";
import Charts from "@components/spendings/spendingDashboard/charts/Charts";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";


const MonthlyCharts = () => {
  const { to } = useDatePickerWrapperStore();
  return (
    to && (
      <div className="flex flex-col items-center bg-grey0 rounded-sm w-[340px] h-[265px] gap-y-2">
        <Charts
          title={dashboardText.dashboard.monthlyCharts.headerTitle}
          periodType={MONTHLY}
        />
      </div>
    )
  );
};

export default MonthlyCharts;
