import SwiftUI
import Charts

struct FlowPoint: Identifiable {
    let id = UUID()
    let month: String
    let income: Double
    let expenses: Double
}

struct CashFlowChartView: View {
    var data: [FlowPoint]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fluxo de Caixa").font(.caption).bold().foregroundColor(.muted).textCase(.uppercase)
            Chart {
                ForEach(data) { point in
                    BarMark(x: .value("Mês", point.month), y: .value("Renda", point.income))
                        .foregroundStyle(Color.success)
                    BarMark(x: .value("Mês", point.month), y: .value("Gastos", point.expenses))
                        .foregroundStyle(Color.danger)
                }
            }
            .frame(height: 200)
        }
        .padding(16)
        .background(Color.surface)
        .cornerRadius(12)
    }
}
