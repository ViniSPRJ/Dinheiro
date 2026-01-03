import SwiftUI

struct BenchmarkTile: View {
    var accountYTD: Double
    var indexYTD: Double
    var indexLabel: String

    var diff: Double { accountYTD - indexYTD }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Comparado a \(indexLabel)").font(.caption).bold().foregroundColor(.muted).textCase(.uppercase)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Você").font(.caption).foregroundColor(.muted)
                    Text("\(String(format: "%.2f", accountYTD))%").font(.title3).bold().foregroundColor(.text)
                }
                Spacer()
                VStack(alignment: .trailing) {
                    Text(indexLabel).font(.caption).foregroundColor(.muted)
                    Text("\(String(format: "%.2f", indexYTD))%").font(.headline).fontWeight(.regular).foregroundColor(.muted)
                }
            }
            
            HStack {
                Image(systemName: diff >= 0 ? "arrow.up.right" : "arrow.down.right")
                Text("\(diff >= 0 ? "Acima" : "Abaixo") por \(String(format: "%.2f", abs(diff))) pp")
            }
            .font(.footnote)
            .fontWeight(.medium)
            .foregroundColor(diff >= 0 ? .success : .danger)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(diff >= 0 ? Color.success.opacity(0.1) : Color.danger.opacity(0.1))
            .cornerRadius(8)
        }
        .padding(16)
        .background(Color.surface)
        .cornerRadius(12)
    }
}
