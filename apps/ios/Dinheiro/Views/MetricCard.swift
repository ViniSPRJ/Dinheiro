import SwiftUI

struct MetricCard: View {
    var title: String
    var value: String
    var subtitle: String?
    enum Trend { case up, down, neutral }
    var trend: Trend = .neutral

    var trendColor: Color {
        switch trend {
        case .up: return .success
        case .down: return .danger
        case .neutral: return .muted
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundColor(.muted)
            Text(value).font(.title2).fontWeight(.semibold).foregroundColor(.text)
            if let subtitle = subtitle {
                Text(subtitle).font(.footnote).foregroundColor(trendColor)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surface)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}
