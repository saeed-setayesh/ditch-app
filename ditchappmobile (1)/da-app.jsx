function App() {
  return (
    <>
      <GlobalCss/>
      <style>{`@keyframes da-frame { 0%,100% {opacity:1} 50% {opacity:0.5} }`}</style>
      <DesignCanvas>
        <DCSection id="company" title="Company · Dispatcher" subtitle="Web app — fleet operations">
          <DCArtboard id="c-disp"   label="01 · Dispatch board"   width={1180} height={820}>
            <CoDispatch/>
          </DCArtboard>
          <DCArtboard id="c-fleet"  label="02 · Fleet"            width={1180} height={820}>
            <CoFleet/>
          </DCArtboard>
          <DCArtboard id="c-drv"    label="03 · Drivers"          width={1180} height={820}>
            <CoDrivers/>
          </DCArtboard>
          <DCArtboard id="c-rpt"    label="04 · Reports"          width={1180} height={820}>
            <CoReports/>
          </DCArtboard>
          <DCArtboard id="c-bill"   label="05 · Billing"          width={1180} height={820}>
            <CoBilling/>
          </DCArtboard>
        </DCSection>
        <DCSection id="tablet" title="Tablet" subtitle="Landscape — list rail + live map">
          <DCArtboard id="t-dash"     label="01 · Dashboard · Light"  width={1180} height={820}>
            <TabletDashboard/>
          </DCArtboard>
          <DCArtboard id="t-detail"   label="02 · Incident detail"    width={1180} height={820}>
            <TabletDetail/>
          </DCArtboard>
          <DCArtboard id="t-fullmap"  label="03 · Full-map view"      width={1180} height={820}>
            <TabletFullMap/>
          </DCArtboard>
          <DCArtboard id="t-filters"  label="04 · Filters"            width={1180} height={820}>
            <TabletFilters/>
          </DCArtboard>
          <DCArtboard id="t-camera"   label="05 · Police camera"      width={1180} height={820}>
            <TabletCamera/>
          </DCArtboard>
          <DCArtboard id="t-navsend"  label="06 · Send to navigation" width={1180} height={820}>
            <TabletNavSend/>
          </DCArtboard>
          <DCArtboard id="t-dark"     label="07 · Dark mode"          width={1180} height={820}>
            <TabletDark/>
          </DCArtboard>
        </DCSection>
        <DCSection id="mobile" title="Mobile" subtitle="iPhone · companion views">
          <DCArtboard id="m-list"     label="08 · List · Active"      width={393} height={852}>
            <MobileList/>
          </DCArtboard>
          <DCArtboard id="m-map"      label="09 · Map · Light"        width={393} height={852}>
            <MobileMap/>
          </DCArtboard>
          <DCArtboard id="m-filters"  label="10 · Filters"            width={393} height={852}>
            <MobileFilters/>
          </DCArtboard>
          <DCArtboard id="m-detail"   label="11 · Detail · Dark"      width={393} height={852}>
            <MobileDetail/>
          </DCArtboard>
          <DCArtboard id="m-camera"   label="12 · Police camera"      width={393} height={852}>
            <MobileCamera/>
          </DCArtboard>
          <DCArtboard id="m-navsend"  label="13 · Send to navigation" width={393} height={852}>
            <MobileNavSend/>
          </DCArtboard>
          <DCArtboard id="m-list-d"   label="14 · List · Dark"        width={393} height={852}>
            <MobileListDark/>
          </DCArtboard>
          <DCArtboard id="m-acct"     label="15 · Account"            width={393} height={852}>
            <MobileAccount/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
