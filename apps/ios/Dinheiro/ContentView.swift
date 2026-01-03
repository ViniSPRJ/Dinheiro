import SwiftUI

struct ContentView: View {
    @State private var selectedPeriod = "Jan 2026"
    
    var body: some View {
        ZStack {
            Color.bg.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Visão Geral").font(.largeTitle).bold().foregroundColor(.text)
                            Text("Bem-vindo de volta").font(.subheadline).foregroundColor(.muted)
                        }
                        Spacer()
                    }
                    .padding(.top)
                    
                    // Metrics Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        MetricCard(title: "Saldo Atual", value: "R$ 124k", subtitle: "+2.4%", trend: .up)
                        MetricCard(title: "Gasto Mensal", value: "R$ 8.4k", subtitle: "65% do orçamento", trend: .neutral)
                    }
                    
                    // Cash Flow
                    CashFlowChartView(data: [
                        FlowPoint(month: "Set", income: 12000, expenses: 8000),
                        FlowPoint(month: "Out", income: 12500, expenses: 9200),
                        FlowPoint(month: "Nov", income: 14000, expenses: 7500),
                        FlowPoint(month: "Dez", income: 22000, expenses: 15000),
                        FlowPoint(month: "Jan", income: 12500, expenses: 8430)
                    ])
                    
                    // Benchmarks
                    VStack(spacing: 16) {
                        BenchmarkTile(accountYTD: 12.4, indexYTD: 10.2, indexLabel: "CDI")
                        BenchmarkTile(accountYTD: 12.4, indexYTD: 14.5, indexLabel: "IBOVESPA")
                    }
                    
                    Spacer(minLength: 50)
                }
                .padding()
            }
        }
    }
}
