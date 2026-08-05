export interface EnemyReportLedgerProfile {
	contradictionDistance: number;
	decayRate: number;
	minimumConfidence: number;
}

export interface EnemyLocalReport {
	cellId: string;
	sourceId: string;
	x: number;
	y: number;
	confidence: number;
}

export interface EnemyReportConsensus {
	cellId: string;
	primarySourceId: string;
	x: number;
	y: number;
	confidence: number;
	trust: number;
	conflict: number;
	reportCount: number;
}

interface ReportRuntime extends EnemyLocalReport {
	age: number;
}

interface ReportCluster {
	reports: ReportRuntime[];
	weight: number;
	x: number;
	y: number;
}

const DEFAULT_PROFILE: EnemyReportLedgerProfile = Object.freeze({
	contradictionDistance: 210,
	decayRate: 0.11,
	minimumConfidence: 0.03,
});

/**
 * An expiring local claim ledger for enemy knowledge.
 *
 * Reports are clustered by compatible position rather than averaged globally.
 * The strongest cluster becomes the working last-known position; competing
 * clusters reduce trust and therefore response intensity. No report is global.
 */
export class EnemyReportLedger {
	private readonly reportsByCell = new Map<string, Map<string, ReportRuntime>>();

	constructor(private readonly profile: EnemyReportLedgerProfile = DEFAULT_PROFILE) {}

	report(input: EnemyLocalReport): EnemyReportConsensus {
		const confidence = clamp01(input.confidence);
		const reports = this.reportsByCell.get(input.cellId) ?? new Map<string, ReportRuntime>();
		reports.set(input.sourceId, {
			...input,
			confidence,
			age: 0,
		});
		this.reportsByCell.set(input.cellId, reports);
		return this.resolve(input.cellId) as EnemyReportConsensus;
	}

	decay(dt: number): void {
		const safeDt = Math.max(0, dt);
		for (const [cellId, reports] of this.reportsByCell) {
			for (const [sourceId, report] of reports) {
				report.age += safeDt;
				report.confidence = Math.max(0, report.confidence - safeDt * this.profile.decayRate);
				if (report.confidence < this.profile.minimumConfidence) reports.delete(sourceId);
			}
			if (reports.size === 0) this.reportsByCell.delete(cellId);
		}
	}

	resolve(cellId: string): EnemyReportConsensus | null {
		const reports = [...(this.reportsByCell.get(cellId)?.values() ?? [])]
			.filter((report) => report.confidence >= this.profile.minimumConfidence)
			.sort((a, b) => b.confidence - a.confidence || a.sourceId.localeCompare(b.sourceId));
		if (reports.length === 0) return null;

		const clusters: ReportCluster[] = [];
		for (const report of reports) {
			const compatible = clusters.find(
				(cluster) => Math.hypot(cluster.x - report.x, cluster.y - report.y) <= this.profile.contradictionDistance
			);
			if (!compatible) {
				clusters.push({ reports: [report], weight: report.confidence, x: report.x, y: report.y });
				continue;
			}
			compatible.reports.push(report);
			compatible.weight += report.confidence;
			compatible.x = weightedCoordinate(compatible.reports, 'x');
			compatible.y = weightedCoordinate(compatible.reports, 'y');
		}

		clusters.sort((a, b) => b.weight - a.weight || b.reports[0]!.confidence - a.reports[0]!.confidence);
		const winner = clusters[0] as ReportCluster;
		const totalWeight = clusters.reduce((total, cluster) => total + cluster.weight, 0);
		const trust = totalWeight > 0 ? clamp01(winner.weight / totalWeight) : 0;
		const conflict = clamp01(1 - trust);
		const strongest = [...winner.reports].sort(
			(a, b) => b.confidence - a.confidence || a.sourceId.localeCompare(b.sourceId)
		)[0] as ReportRuntime;
		const strongestConfidence = Math.max(...winner.reports.map((report) => report.confidence));

		return {
			cellId,
			primarySourceId: strongest.sourceId,
			x: weightedCoordinate(winner.reports, 'x'),
			y: weightedCoordinate(winner.reports, 'y'),
			confidence: clamp01(strongestConfidence * (0.55 + trust * 0.45)),
			trust,
			conflict,
			reportCount: reports.length,
		};
	}

	getSnapshot(): EnemyReportConsensus[] {
		return [...this.reportsByCell.keys()]
			.map((cellId) => this.resolve(cellId))
			.filter((entry): entry is EnemyReportConsensus => Boolean(entry))
			.sort((a, b) => a.cellId.localeCompare(b.cellId));
	}
}

function weightedCoordinate(reports: readonly ReportRuntime[], key: 'x' | 'y'): number {
	const total = reports.reduce((sum, report) => sum + report.confidence, 0);
	if (total <= 0) return reports[0]?.[key] ?? 0;
	return reports.reduce((sum, report) => sum + report[key] * report.confidence, 0) / total;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}
