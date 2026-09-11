import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Search,
  Settings,
  UploadCloud,
  Users,
  WalletCards,
} from "lucide-react";

const transactions = [
  { client: "인천대학교 산학협력단", title: "브랜딩 전략 컨설팅", amount: "₩3,300,000", invoice: "발행 완료", payment: "입금 대기" },
  { client: "건강미", title: "브랜드 운영", amount: "₩1,980,000", invoice: "발행 완료", payment: "입금 완료" },
  { client: "ODE BELL", title: "브랜드 디자인", amount: "₩3,300,000", invoice: "확인 필요", payment: "입금 대기" },
  { client: "PHYTO REVOLUTION", title: "브랜딩 프로젝트", amount: "₩1,650,000", invoice: "발행 완료", payment: "입금 완료" },
];

function Sidebar() {
  const nav = [
    [LayoutDashboard, "대시보드", true],
    [UploadCloud, "문서 업로드", false],
    [WalletCards, "거래", false],
    [Users, "거래처", false],
    [FileText, "문서", false],
    [BarChart3, "통계", false],
  ] as const;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">N</div>
        <div className="brand-copy">
          <strong>NINEWORKS TAX</strong>
          <span>Finance Operations</span>
        </div>
      </div>

      <nav className="nav" aria-label="주요 메뉴">
        {nav.map(([Icon, label, active]) => (
          <a className={`nav-item${active ? " active" : ""}`} href="#" key={label}>
            <Icon aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>

      <div className="sidebar-foot">
        <a className="nav-item" href="#">
          <Settings aria-hidden="true" />
          설정
        </a>
        <p>© 2026 NINEWORKS</p>
      </div>
    </aside>
  );
}

function Metric({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">{meta}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="app-shell">
      <Sidebar />

      <header className="mobile-topbar">
        <div className="mobile-brand">NINEWORKS TAX</div>
        <button className="mobile-menu" aria-label="메뉴 열기">
          <Menu size={19} />
        </button>
      </header>

      <main className="main">
        <div className="page">
          <header className="page-header">
            <div>
              <p className="eyebrow">2026.09</p>
              <h1 className="page-title">재무 현황</h1>
              <p className="page-description">
                세금계산서 파일을 기준으로 거래처, 거래금액, 거래명세서와 견적서를 하나의 거래 데이터로 관리합니다.
              </p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary"><Search />거래 검색</button>
              <button className="btn btn-primary"><UploadCloud />세금계산서 업로드</button>
            </div>
          </header>

          <section className="metrics" aria-label="월간 주요 지표">
            <Metric label="이번 달 매출" value="₩14,850,000" meta="공급가액 기준" />
            <Metric label="입금 완료" value="₩10,890,000" meta="73.3% 수금" />
            <Metric label="미수금" value="₩3,960,000" meta="2건 확인 필요" />
            <Metric label="이번 달 매입" value="₩4,320,000" meta="증빙 7건" />
          </section>

          <div className="grid-main">
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">세금계산서 업로드</h2>
                  <p className="section-description">파일 하나로 거래 데이터와 문서 생성을 시작합니다.</p>
                </div>
              </div>

              <label className="upload-zone">
                <input type="file" accept=".pdf,.xml,.jpg,.jpeg,.png" hidden />
                <span className="upload-icon"><UploadCloud aria-hidden="true" /></span>
                <h3 className="upload-title">세금계산서를 여기에 놓아주세요.</h3>
                <p className="upload-description">파일을 드래그하거나 직접 선택할 수 있습니다.</p>
                <p className="upload-support">PDF · XML · JPG · PNG</p>
                <span className="btn btn-primary">파일 선택하기</span>
              </label>
            </section>

            <aside className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">업로드 후 자동 처리</h2>
                  <p className="section-description">등록 전 추출 결과를 한 번 확인합니다.</p>
                </div>
              </div>
              <div className="panel summary-panel">
                <dl className="summary-list">
                  <div className="summary-row"><dt>거래처 자동 매칭</dt><dd>사업자번호 기준</dd></div>
                  <div className="summary-row"><dt>거래 자동 생성</dt><dd>매출 / 매입 분류</dd></div>
                  <div className="summary-row"><dt>거래명세서</dt><dd>자동 초안</dd></div>
                  <div className="summary-row"><dt>견적서</dt><dd>자동 초안</dd></div>
                  <div className="summary-row summary-total"><dt>누적 거래액</dt><dd>자동 반영</dd></div>
                </dl>
              </div>
            </aside>
          </div>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">최근 거래</h2>
                <p className="section-description">최근 등록된 거래와 계산서·입금 상태입니다.</p>
              </div>
              <button className="btn btn-ghost">전체 거래 보기</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>거래처</th>
                    <th>거래 내용</th>
                    <th style={{ textAlign: "right" }}>거래금액</th>
                    <th>세금계산서</th>
                    <th>입금</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item) => (
                    <tr key={`${item.client}-${item.title}`}>
                      <td className="cell-main"><Building2 size={14} style={{ marginRight: 8, verticalAlign: -2 }} />{item.client}</td>
                      <td>{item.title}</td>
                      <td className="amount">{item.amount}</td>
                      <td><span className={`status ${item.invoice === "확인 필요" ? "status-warning" : "status-primary"}`}>{item.invoice}</span></td>
                      <td><span className={`status ${item.payment === "입금 완료" ? "status-success" : "status-warning"}`}>{item.payment}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
