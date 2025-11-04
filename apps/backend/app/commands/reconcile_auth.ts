import { BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';
import { AuthReconciliationService } from '#services/auth_reconciliation_service';

export default class ReconcileAuth extends BaseCommand {
  static commandName = 'reconcile:auth';
  static description = 'Reconcile authentication sync errors';

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    this.logger.info('Starting authentication reconciliation...');

    try {
      const result = await AuthReconciliationService.runReconciliation();

      this.logger.info('Reconciliation complete:');
      this.logger.info(
        `  Syncs: ${result.syncs.success} succeeded, ${result.syncs.failed} failed`
      );
      this.logger.info(
        `  Mappings: ${result.mappings.fixed} fixed, ${result.mappings.failed} failed`
      );
    } catch (error: any) {
      this.logger.error(`Reconciliation failed: ${error.message}`);
      this.exitCode = 1;
    }
  }
}

