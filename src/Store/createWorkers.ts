import { getValueCreator } from './valueCreator';
import { getDependencyWorker } from './dependencyWorker';
import { SharedData } from './SharedData'


export const createWorkers = (sharedData: SharedData) => {
  const depWorker = getDependencyWorker(sharedData);
  const valGetter = (valueId: symbol) => () => depWorker.getDataWithListeningDependencies(valueId)
  const valCreator = getValueCreator(sharedData, valGetter);

  return {
    ...depWorker,
    ...valCreator
  };
};
