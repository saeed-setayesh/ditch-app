function App() {
  return (
    <>
      <GlobalCss/>
      <DesignCanvas>
        <DCSection id="tablet" title="Tablet" subtitle="Landscape — list rail + live map">
          <DCArtboard id="t-dash"     label="01 · Dashboard · Light"  width={1180} height={820}>
            <TabletDashboard/>
          </DCArtboard>
          <DCArtboard id="t-detail"   label="02 · Incident detail"    width={1180} height={820}>
            <TabletDetail/>
          </DCArtboard>
          <DCArtboard id="t-filters"  label="03 · Filters"            width={1180} height={820}>
            <TabletFilters/>
          </DCArtboard>
          <DCArtboard id="t-dark"     label="04 · Dark mode"          width={1180} height={820}>
            <TabletDark/>
          </DCArtboard>
        </DCSection>
        <DCSection id="mobile" title="Mobile" subtitle="iPhone · companion views">
          <DCArtboard id="m-list"     label="05 · List · Active"      width={393} height={852}>
            <MobileList/>
          </DCArtboard>
          <DCArtboard id="m-map"      label="06 · Map · Light"        width={393} height={852}>
            <MobileMap/>
          </DCArtboard>
          <DCArtboard id="m-filters"  label="07 · Filters"            width={393} height={852}>
            <MobileFilters/>
          </DCArtboard>
          <DCArtboard id="m-detail"   label="08 · Detail · Dark"      width={393} height={852}>
            <MobileDetail/>
          </DCArtboard>
          <DCArtboard id="m-list-d"   label="09 · List · Dark"        width={393} height={852}>
            <MobileListDark/>
          </DCArtboard>
          <DCArtboard id="m-acct"     label="10 · Account"            width={393} height={852}>
            <MobileAccount/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
